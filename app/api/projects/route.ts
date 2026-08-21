import { NextRequest, NextResponse } from 'next/server';
import { projectDb } from '@/lib/db-helpers/projects';
import type { ProjectStatus } from '@/types';

// GET /api/projects - List projects
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;
    const statusParam = searchParams.get('status');
    const status = statusParam ? (statusParam as ProjectStatus) : undefined;

    const [projects, total] = await Promise.all([
      projectDb.findAll({ limit, offset, search, status }),
      projectDb.count({ search, status }),
    ]);

    return NextResponse.json({ projects, total });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.customer_id) {
      return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
    }

    // Create project (assuming created_by from session - in real app, get from auth)
    const id = await projectDb.create({
      customer_id: body.customer_id,
      status: 'NEW' as ProjectStatus,
      account_number: body.account_number || null,
      consumer_number: body.consumer_number || null,
      discom: body.discom || null,
      subdivision: body.subdivision || null,
      division: body.division || null,
      sanctioned_load: body.sanctioned_load || null,
      solar_load: body.solar_load || null,
      site_address: body.site_address || null,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
      capacity: body.capacity || null,
      created_by: 1, // In real app, get from session
    });

    const project = await projectDb.findById(id);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
