import { NextRequest, NextResponse } from 'next/server';
import { projectDb } from '@/lib/db-helpers/projects';

// GET /api/projects/[id] - Get project by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await projectDb.findById(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const body = await request.json();

    await projectDb.update(id, {
      customer_id: body.customer_id,
      status: body.status,
      account_number: body.account_number,
      consumer_number: body.consumer_number,
      discom: body.discom,
      subdivision: body.subdivision,
      division: body.division,
      sanctioned_load: body.sanctioned_load,
      solar_load: body.solar_load,
      site_address: body.site_address,
      latitude: body.latitude,
      longitude: body.longitude,
      capacity: body.capacity,
      installation_date: body.installation_date,
      verified_by: body.verified_by,
      verified_at: body.verified_at,
    });

    const project = await projectDb.findById(id);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    await projectDb.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
