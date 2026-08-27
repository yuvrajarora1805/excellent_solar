import { NextRequest, NextResponse } from 'next/server';
import { installationDb } from '@/lib/db-helpers/installation';
import { reservationDb } from '@/lib/db-helpers/reservations';
import { projectDb } from '@/lib/db-helpers/projects';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();

    if (body.approved !== undefined) {
      await installationDb.verifyInstallation(id, body.approved, body.reason);
      const inst = await installationDb.findById(id);

      if (body.approved) {
        if (inst?.project_id) {
          await reservationDb.issue(inst.project_id as number);
          await projectDb.updateStatus(
            inst.project_id as number,
            'FINAL_VERIFICATION' as any,
            1,
            'Installation verified by manager'
          );
        }
      } else {
        if (inst?.project_id) {
          await projectDb.updateStatus(
            inst.project_id as number,
            'INSTALLATION_STARTED' as any,
            1,
            `Installation rejected: ${body.reason || 'Needs revision'}`
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to verify installation:', error);
    return NextResponse.json({ error: 'Failed to verify installation' }, { status: 500 });
  }
}
