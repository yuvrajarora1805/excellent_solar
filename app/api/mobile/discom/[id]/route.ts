import { NextRequest, NextResponse } from 'next/server';
import { discomDb, jeVerificationDb, sdoVerificationDb, xenVerificationDb } from '@/lib/db-helpers/discom';

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
