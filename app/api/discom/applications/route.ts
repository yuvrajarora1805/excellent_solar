import { NextRequest, NextResponse } from 'next/server';
import { discomDb } from '@/lib/db-helpers/discom';

export async function GET(request: NextRequest) {
  try {
    const applications = await discomDb.findAll();
    return NextResponse.json({ applications });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    const id = await discomDb.create(project_id);
    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating DISCOM application:', error);
    // Duplicate entry (project already has an application)
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'This project already has a DISCOM application' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
