import { NextRequest, NextResponse } from 'next/server';
import { discomDb, documentDb, jeVerificationDb, sdoVerificationDb, xenVerificationDb } from '@/lib/db-helpers/discom';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/discom/[id] - Get DISCOM application details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const application = await discomDb.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const documents = await documentDb.findByApplicationId(id);
    const jeVerification = await jeVerificationDb.findByApplicationId(id);
    const sdoVerification = await sdoVerificationDb.findByApplicationId(id);
    const xenVerification = await xenVerificationDb.findByApplicationId(id);

    return NextResponse.json({
      ...application,
      documents,
      je_verification_status: jeVerification?.status || 'PENDING',
      sdo_verification_status: sdoVerification?.status || 'PENDING',
      xen_verification_status: xenVerification?.status || 'PENDING',
    });
  } catch (error) {
    console.error('Error fetching DISCOM application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// PUT /api/discom/[id] - Update verifications
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { stage, status, action, updateData } = body; 

    if (action === 'update_fields' && updateData) {
      await discomDb.update(id, updateData);
    } else if (stage === 'je') {
      await jeVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else if (stage === 'sdo') {
      await sdoVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else if (stage === 'xen') {
      await xenVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else {
      return NextResponse.json({ error: 'Invalid verification stage or action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating DISCOM application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// POST /api/discom/[id] - Upload document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const formData = await request.formData();
    
    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    let photoPath = '';
    const file = formData.get('file') as File | null;
    const documentName = formData.get('documentName') as string || 'Document';

    const isFileApply = formData.get('is_file_apply') === 'true';

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `doc_${id}_${Date.now()}_${file.name.replaceAll(' ', '_')}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      photoPath = `/uploads/${filename}`;
    } else {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (isFileApply) {
      await discomDb.update(id, { file_apply_upload_path: photoPath });
    } else {
      const fileName = file.name;
      const fileSize = file.size;
      const mimeType = file.type || 'application/octet-stream';

      await documentDb.create({
        discom_application_id: id,
        document_type_id: 1, // Fallback
        file_name: documentName,
        file_path: photoPath,
        file_size: fileSize,
        mimeType: mimeType,
        status: 'APPROVED',
        verified_by: 1,
        created_by: 1 // Fallback
      } as any);
    }

    return NextResponse.json({ success: true, message: 'Document uploaded', path: photoPath });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
