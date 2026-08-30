import { NextRequest, NextResponse } from 'next/server';
import { discomDb, documentDb, jeVerificationDb, sdoVerificationDb, xenVerificationDb } from '@/lib/db-helpers/discom';
import { DiscomStatus } from '@/types';
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

    const { query } = await import('@/lib/db');

    const documents = await documentDb.findByApplicationId(id);
    const jeVerification = await jeVerificationDb.findByApplicationId(id);
    const sdoVerification = await sdoVerificationDb.findByApplicationId(id);
    const xenVerification = await xenVerificationDb.findByApplicationId(id);

    // Fetch associated store & challan dispatch data for this project/customer
    let storeChallans: any[] = [];
    let materialIssues: any[] = [];
    if (application.project_id) {
      // 1. Fetch dispatch orders / vehicle challans
      storeChallans = await query(
        `SELECT o.*, c.name as customer_name
         FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         WHERE o.customer_id = (SELECT customer_id FROM projects WHERE id = ?)
         ORDER BY o.created_at DESC`,
        [application.project_id]
      ) as any[];

      // Attach items for each challan
      for (const challan of storeChallans) {
        challan.items = await query(
          `SELECT oi.*, p.name as product_name, p.product_code, p.unit
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [challan.id]
        );
      }

      // 2. Fetch material issues for this project
      materialIssues = await query(
        `SELECT mi.*, u.name as created_by_name
         FROM material_issues mi
         LEFT JOIN users u ON mi.created_by = u.id
         WHERE mi.project_id = ?
         ORDER BY mi.issue_date DESC`,
        [application.project_id]
      ) as any[];

      for (const mi of materialIssues) {
        mi.items = await query(
          `SELECT mii.*, p.name as product_name, p.product_code
           FROM material_issue_items mii
           JOIN products p ON mii.product_id = p.id
           WHERE mii.material_issue_id = ?`,
          [mi.id]
        );
      }
    }

    return NextResponse.json({
      ...application,
      documents,
      je_verification_status: jeVerification?.status || 'PENDING',
      sdo_verification_status: sdoVerification?.status || 'PENDING',
      xen_verification_status: xenVerification?.status || 'PENDING',
      store_challans: storeChallans,
      material_issues: materialIssues,
    });
  } catch (error) {
    console.error('Error fetching DISCOM application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

// PUT /api/discom/[id] - Update verifications, NP confirmation, meter status & office approvals
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { stage, status, action, updateData, np_number, meter_status, meter_effect, remarks } = body; 

    if (action === 'confirm_np') {
      await discomDb.update(id, {
        np_number: np_number || updateData?.np_number,
        np_confirmed: 1,
        np_confirmed_at: new Date(),
      });
    } else if (action === 'verify_meter') {
      await discomDb.update(id, {
        meter_status: meter_status || 'AVAILABLE',
        meter_effect: meter_effect || 'YES',
        meter_verified_at: new Date(),
      });
    } else if (action === 'office_approve') {
      await discomDb.update(id, {
        office_approval_status: status || 'APPROVED',
        office_approval_remarks: remarks || null,
        status: (status === 'APPROVED' ? DiscomStatus.APPROVED : DiscomStatus.DRAFT) as any,
      });
    } else if (action === 'update_fields' && updateData) {
      await discomDb.update(id, updateData);
    } else if (stage === 'je') {
      await jeVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else if (stage === 'sdo') {
      await sdoVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else if (stage === 'xen') {
      await xenVerificationDb.createOrUpdate({ discom_application_id: id, status });
    } else {
      await discomDb.update(id, body);
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
