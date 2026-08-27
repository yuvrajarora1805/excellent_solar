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
    const survey = await siteSurveyDb.findById(id);
    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }
    return NextResponse.json(survey);
  } catch (error) {
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
    console.error('Failed to verify survey:', error);
    return NextResponse.json({ error: 'Failed to verify survey' }, { status: 500 });
  }
}
