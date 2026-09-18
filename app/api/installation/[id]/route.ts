import { NextRequest, NextResponse } from 'next/server';
import { installationDb } from '@/lib/db-helpers/installation';
import { reservationDb } from '@/lib/db-helpers/reservations';
import { projectDb } from '@/lib/db-helpers/projects';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const installation = await installationDb.findById(id);
    if (!installation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }

    let reservations: any[] = [];
    try {
      // installation.project_id is a string identifier due to the SQL join (e.g., 'PRJ-1234')
      const project = typeof installation.project_id === 'string' 
        ? await projectDb.findByProjectId(installation.project_id)
        : null;
      const realProjectId = project ? project.id : installation.project_id as number;
      
      reservations = await reservationDb.findByProject(realProjectId);
    } catch {
      // reservations optional
    }

    return NextResponse.json({ ...installation, reservations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch installation' }, { status: 500 });
  }
}

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

      if (inst?.project_id) {
        const project = typeof inst.project_id === 'string'
          ? await projectDb.findByProjectId(inst.project_id)
          : null;
        const realProjectId = project ? project.id : inst.project_id as number;

        if (body.approved) {
          await reservationDb.issue(realProjectId);
          await projectDb.updateStatus(
            realProjectId,
            'FINAL_VERIFICATION' as any,
            1,
            'Installation verified by manager'
          );
        } else {
          await projectDb.updateStatus(
            realProjectId,
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
    console.error('Failed to update installation:', error);
    return NextResponse.json({ error: 'Failed to update installation' }, { status: 500 });
  }
}
