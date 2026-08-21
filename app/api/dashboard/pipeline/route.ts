import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard/pipeline - Get project pipeline data
export async function GET() {
  try {
    const pipelineData = await query(`
      SELECT
        CASE
          WHEN p.status = 'NEW' THEN 'Lead'
          WHEN p.status IN ('SITE_SURVEY', 'SURVEY_SUBMITTED', 'SURVEY_VERIFIED') THEN 'Survey'
          WHEN p.status IN ('MATERIAL_ALLOCATED', 'INSTALLATION_STARTED', 'INSTALLATION_COMPLETED', 'FINAL_VERIFICATION') THEN 'Install'
          WHEN p.status = 'PROJECT_COMPLETED' THEN 'Done'
          ELSE 'DISCOM'
        END as stage,
        COUNT(*) as count
      FROM projects p
      GROUP BY stage
      ORDER BY
        FIELD(stage, 'Lead', 'Survey', 'DISCOM', 'Install', 'Done')
    `);

    return NextResponse.json(pipelineData);
  } catch (error) {
    console.error('Error fetching pipeline data:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline data' }, { status: 500 });
  }
}
