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
      
      // If approved, advance the project status to INSTALLATION_STARTED and approve all pending photos
      if (body.approved) {
        try {
          // Approve all pending photos
          await query('UPDATE site_survey_photos SET status = ? WHERE site_survey_id = ? AND status = ?', ['APPROVED', id, 'PENDING']);

          const survey = await siteSurveyDb.findById(id);
          if (survey?.project_id) {
            // Hardcoded changedBy=1 as we don't have session user here easily
            await projectDb.updateStatus(
              survey.project_id as number,
              'INSTALLATION_STARTED' as any,
              1,
              'Advanced automatically after survey approval'
            );
          }
        } catch (err) {
          console.error('Failed to advance project status after survey approval:', err);
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
  }
}
