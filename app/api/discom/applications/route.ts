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
    const { project_id, np_number, application_date } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
    }

    let id: number;
    let isNew = false;
    
    // Check if application already exists
    const existing = await discomDb.findByProjectId(project_id);
    
    if (existing) {
      id = existing.id;
    } else {
      id = await discomDb.create(project_id);
      isNew = true;
    }

    // If extra fields are provided, update the application
    if (np_number || application_date) {
      const updateData: any = {};
      if (np_number) updateData.np_number = np_number;
      if (application_date) updateData.application_date = application_date;
      
      // If it's a new app and we immediately give it an NP number, mark it as SUBMITTED_TO_DISCOM
      if (isNew && np_number) {
        updateData.status = 'SUBMITTED_TO_DISCOM';
      }
      
      await discomDb.update(id, updateData);
    }

    return NextResponse.json({ success: true, id, message: isNew ? 'Application created' : 'Application updated' }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating/updating DISCOM application:', error);
    return NextResponse.json({ error: 'Failed to process application' }, { status: 500 });
  }
}
