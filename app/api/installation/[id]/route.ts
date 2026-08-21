import { NextRequest, NextResponse } from 'next/server';
import { installationDb } from '@/lib/db-helpers/installation';
import { reservationDb } from '@/lib/db-helpers/reservations';

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

    // Also fetch reserved items for this installation's project
    let reservations: any[] = [];
    try {
      reservations = await reservationDb.findByProject(installation.project_id as number);
    } catch {
      // reservations are optional — don't break if not found
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

      // If approved, auto-issue all RESERVED items for this project (mark as sold)
      if (body.approved) {
        try {
          const installation = await installationDb.findById(id);
          if (installation?.project_id) {
            await reservationDb.issue(installation.project_id as number);
          }
        } catch (err) {
          console.error('Failed to auto-issue reservations on installation approval:', err);
          // Don't fail the verification if reservation update fails
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update installation' }, { status: 500 });
  }
}
