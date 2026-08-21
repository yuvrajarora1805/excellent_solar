import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json({ error: 'worker_id is required' }, { status: 400 });
    }

    // Since we didn't add assigned_to to projects, we'll mock the assignment for now
    // In a real scenario: 'SELECT p.*, c.name as customer_name, c.address ... FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.assigned_to = ?'
    
    // We'll just return all active projects/jobs to demonstrate the mobile app integration
    const sql = `
      SELECT 
        p.id, p.project_id, p.status, p.site_address,
        c.name as customer_name, c.mobile
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.status NOT IN ('PROJECT_COMPLETED')
      ORDER BY p.id DESC
    `;
    
    const jobs = await query(sql) as any[];

    const formattedJobs = jobs.map(job => {
      let displayStatus = 'Unknown';
      let isSurvey = false;
      let isActionable = true;

      switch(job.status) {
        case 'NEW':
        case 'SITE_SURVEY':
          displayStatus = 'Site Survey';
          isSurvey = true;
          isActionable = true;
          break;
        case 'SURVEY_SUBMITTED':
          displayStatus = 'Pending Survey Approval';
          isSurvey = true;
          isActionable = false;
          break;
        case 'SURVEY_VERIFIED':
        case 'MATERIAL_ALLOCATED':
        case 'INSTALLATION_STARTED':
          displayStatus = 'Installation Ready';
          isSurvey = false;
          isActionable = true;
          break;
        case 'INSTALLATION_COMPLETED':
        case 'FINAL_VERIFICATION':
          displayStatus = 'Installation Finished';
          isSurvey = false;
          isActionable = false;
          break;
        default:
          displayStatus = job.status;
          isSurvey = false;
          isActionable = false;
      }

      return {
        id: job.id,
        job_id: job.project_id,
        customer_name: job.customer_name,
        address: job.site_address || 'Address pending',
        mobile: job.mobile,
        type: displayStatus,
        is_survey: isSurvey,
        is_actionable: isActionable,
        status: job.status,
        priority: 'High'
      };
    });

    return NextResponse.json({ success: true, jobs: formattedJobs });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
