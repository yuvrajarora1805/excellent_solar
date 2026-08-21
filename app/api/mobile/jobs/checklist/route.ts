import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { job_id, checklist_data } = await request.json();

    if (!job_id || !checklist_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Determine if this is a survey or installation based on project status
    const projects = await query('SELECT status FROM projects WHERE id = ?', [job_id]) as any[];
    if (projects.length === 0) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    
    const status = projects[0].status;
    const isSurvey = status === 'NEW' || status === 'SITE_SURVEY' || status === 'SURVEY_SUBMITTED' || status === 'SURVEY_REJECTED';

    if (isSurvey) {
      // Check if survey exists
      const surveys = await query('SELECT id FROM site_surveys WHERE project_id = ?', [job_id]) as any[];
      if (surveys.length === 0) {
        await query(
          'INSERT INTO site_surveys (project_id, roof_type, shading, extra_structure, created_by) VALUES (?, ?, ?, ?, ?)',
          [
            job_id, 
            checklist_data.roof_type || 'Concrete', 
            checklist_data.shading === true ? 1 : 0, 
            checklist_data.extra_structure === true ? 1 : 0,
            1 // Mocked user ID
          ]
        );
      } else {
        await query(
          'UPDATE site_surveys SET roof_type = ?, shading = ?, extra_structure = ? WHERE project_id = ?',
          [
            checklist_data.roof_type || 'Concrete',
            checklist_data.shading === true ? 1 : 0,
            checklist_data.extra_structure === true ? 1 : 0,
            job_id
          ]
        );
      }
    } else {
      // Installation
      const installs = await query('SELECT id FROM installations WHERE project_id = ?', [job_id]) as any[];
      if (installs.length === 0) {
        await query(
          'INSERT INTO installations (project_id, structure_installed, earthing_completed, wiring_completed, testing_completed, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          [
            job_id,
            checklist_data.structure_installed === true ? 1 : 0,
            checklist_data.earthing_completed === true ? 1 : 0,
            checklist_data.wiring_completed === true ? 1 : 0,
            checklist_data.testing_completed === true ? 1 : 0,
            1 // Mocked user ID
          ]
        );
      } else {
        await query(
          'UPDATE installations SET structure_installed = ?, earthing_completed = ?, wiring_completed = ?, testing_completed = ? WHERE project_id = ?',
          [
            checklist_data.structure_installed === true ? 1 : 0,
            checklist_data.earthing_completed === true ? 1 : 0,
            checklist_data.wiring_completed === true ? 1 : 0,
            checklist_data.testing_completed === true ? 1 : 0,
            job_id
          ]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Checklist updated successfully' });

  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
