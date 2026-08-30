import { NextRequest, NextResponse } from 'next/server';
import { siteSurveyDb } from '@/lib/db-helpers/site-survey';
import { projectDb } from '@/lib/db-helpers/projects';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    // First try by survey ID, then by project ID
    let survey = await siteSurveyDb.findById(id);
    if (!survey) {
      survey = await siteSurveyDb.findByProjectId(id);
    }

    if (!survey) {
      // If survey row does not exist yet, check if project has photos or booking site photo
      const projects = await query<any>('SELECT * FROM projects WHERE id = ?', [id]);
      if (projects.length > 0) {
        const p = projects[0];
        const photos = await query<any>(
          `SELECT ssp.*, COALESCE(u.name, 'Field Worker') as uploader_name, COALESCE(u.role, 'MARKETING') as uploader_role
           FROM site_survey_photos ssp
           LEFT JOIN users u ON ssp.uploaded_by = u.id
           WHERE ssp.site_survey_id IN (SELECT id FROM site_surveys WHERE project_id = ?)`,
          [id]
        );
        
        // Include the original booking site photo if no other photos exist
        if (p.site_photo_path && (!photos || photos.length === 0)) {
          photos.push({
            id: -1,
            category: 'site_photo',
            file_name: p.site_photo_path.split('/').pop() || 'booking_photo.jpg',
            file_path: p.site_photo_path,
            uploader_name: 'Customer Booking',
            uploader_role: 'SYSTEM',
            created_at: p.created_at,
          });
        }

        return NextResponse.json({
          id: 0,
          project_id: id,
          status: p.status,
          roof_type: 'N/A',
          roof_condition: 'Good',
          available_area: null,
          photos: photos || [],
        });
      }
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }
    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json({ error: 'Failed to fetch survey' }, { status: 500 });
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
      await siteSurveyDb.verifySurvey(id, body.approved, body.reason);
      
      const survey = await siteSurveyDb.findById(id);

      if (body.approved) {
        // Approve all pending photos
        await query('UPDATE site_survey_photos SET status = ? WHERE site_survey_id = ? AND status = ?', ['APPROVED', id, 'PENDING']);

        if (survey?.project_id) {
          await projectDb.updateStatus(
            survey.project_id as number,
            'SURVEY_VERIFIED' as any,
            1,
            'Site survey verified by manager'
          );
        }
      } else {
        // Rejected: reset project status to SITE_SURVEY so worker can re-submit
        if (survey?.project_id) {
          await projectDb.updateStatus(
            survey.project_id as number,
            'SITE_SURVEY' as any,
            1,
            `Site survey rejected: ${body.reason || 'Needs revision'}`
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update survey:', error);
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
  }
}
