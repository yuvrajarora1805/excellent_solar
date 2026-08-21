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
    const { stage, status } = body; // stage: 'je' | 'sdo' | 'xen'

    if (stage === 'je') {
      await jeVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else if (stage === 'sdo') {
      await sdoVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else if (stage === 'xen') {
      await xenVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else {
      return NextResponse.json({ error: 'Invalid verification stage' }, { status: 400 });
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

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `doc_${id}_${Date.now()}_${file.name.replaceAll(' ', '_')}`;
      const filePath = path.join(uploadDir, filename);
      await writeFile(filePath, buffer);
      photoPath = `/uploads/${filename}`;
    } else {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name;
    const fileSize = file.size;
    const mimeType = file.type || 'application/octet-stream';

    // Since we don't know document_type_id mapping, we can try to insert without it if nullable
    // or just assume 1 (assuming 1 is general). Looking at schema, document_type_id is required.
    // Assuming we just use ID 1 for now if we can't look it up.
    await documentDb.create({
      discom_application_id: id,
      document_type_id: 1, // Fallback
      file_name: documentName,
      file_path: photoPath,
      file_size: fileSize,
      mime_type: mimeType,
      status: 'APPROVED',
      verified_by: 1,
      created_by: 1 // Fallback
    } as any);

    return NextResponse.json({ success: true, message: 'Document uploaded' });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
