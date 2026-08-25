import { NextRequest, NextResponse } from 'next/server';
import { discomDb, jeVerificationDb, sdoVerificationDb, xenVerificationDb, documentDb } from '@/lib/db-helpers/discom';

// GET /api/mobile/discom/[id] - Fetch full discom application details for mobile app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const application = await discomDb.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const je_verification = await jeVerificationDb.findByApplicationId(id);
    const sdo_verification = await sdoVerificationDb.findByApplicationId(id);
    const xen_verification = await xenVerificationDb.findByApplicationId(id);
    const documents = await documentDb.findByApplicationId(id);
    const checklist = await documentDb.getChecklist(id);

    return NextResponse.json({
      success: true,
      application: {
        ...application,
        je_verification,
        sdo_verification,
        xen_verification,
        documents,
        checklist
      }
    });
  } catch (error) {
    console.error('Error fetching DISCOM application details:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}

// PUT /api/mobile/discom/[id] - Update fields for mobile app
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const { action, updateData, stage, status } = body; 

    if (action === 'update_fields' && updateData) {
      await discomDb.update(id, updateData);
    } else if (stage) {
      // Update verification stage status
      if (stage === 'je') {
        await jeVerificationDb.createOrUpdate({ discom_application_id: id, status });
      } else if (stage === 'sdo') {
        await sdoVerificationDb.createOrUpdate({ discom_application_id: id, status });
      } else if (stage === 'xen') {
        await xenVerificationDb.createOrUpdate({ discom_application_id: id, status });
      } else if (stage === 'second_approval') {
        await discomDb.update(id, { second_approval_status: status });
      } else {
        return NextResponse.json({ error: 'Invalid verification stage' }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error) {
    console.error('Error updating DISCOM application from mobile:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
