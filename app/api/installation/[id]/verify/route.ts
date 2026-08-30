import { NextRequest, NextResponse } from 'next/server';
import { installationDb } from '@/lib/db-helpers/installation';
import { reservationDb } from '@/lib/db-helpers/reservations';
import { projectDb } from '@/lib/db-helpers/projects';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    let installation = await installationDb.findById(id);
    if (!installation) {
      installation = await installationDb.findByProjectId(id);
    }

    if (!installation) {
      const projects = await query<any>('SELECT * FROM projects WHERE id = ?', [id]);
      if (projects.length > 0) {
        const photos = await query<any>(
          `SELECT ip.*, COALESCE(u.name, 'Installer') as uploader_name, COALESCE(u.role, 'INSTALLATION') as uploader_role
           FROM installation_photos ip
           LEFT JOIN users u ON ip.uploaded_by = u.id
           WHERE ip.installation_id IN (SELECT id FROM installations WHERE project_id = ?)`,
          [id]
        );
        return NextResponse.json({
          id: 0,
          project_id: id,
          installed_capacity: null,
          photos: photos || [],
          reservations: [],
        });
      }
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }

    let reservations: any[] = [];
    try {
      reservations = await reservationDb.findByProject(installation.project_id as number);
    } catch {
      // reservations optional
    }

    return NextResponse.json({ ...installation, reservations });
  } catch (error) {
    console.error('Error fetching installation:', error);
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
