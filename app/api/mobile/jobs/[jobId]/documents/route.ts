import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const resolvedParams = await params;
    const jobId = resolvedParams.jobId;

    // Check project status to determine if survey or installation
    const projects = await query('SELECT status FROM projects WHERE id = ?', [jobId]) as any[];
    if (projects.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const status = projects[0].status;
    const isSurvey = ['NEW', 'SITE_SURVEY', 'SURVEY_SUBMITTED', 'SURVEY_REJECTED'].includes(status);

    let documents = [];

    if (isSurvey) {
      const surveys = await query('SELECT id FROM site_surveys WHERE project_id = ?', [jobId]) as any[];
      if (surveys.length > 0) {
        documents = await query(
          'SELECT category, file_path as url, status, rejection_reason FROM site_survey_photos WHERE site_survey_id = ? ORDER BY created_at ASC',
          [surveys[0].id]
        ) as any[];
      }
    } else {
      const installs = await query('SELECT id FROM installations WHERE project_id = ?', [jobId]) as any[];
      if (installs.length > 0) {
        documents = await query(
          'SELECT category, file_path as url FROM installation_photos WHERE installation_id = ?',
          [installs[0].id]
        ) as any[];
      }
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
