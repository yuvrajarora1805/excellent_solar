import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json({ error: 'worker_id is required' }, { status: 400 });
    }

    const sql = `
      SELECT 
        p.id, p.project_id, p.status, p.site_address, p.created_at, p.installation_date,
        c.name as customer_name, c.mobile
      FROM projects p
      JOIN customers c ON p.customer_id = c.id
      WHERE p.status NOT IN ('PROJECT_COMPLETED')
      ORDER BY p.id DESC
    `;
    
    const jobs = await query(sql) as any[];
    const sectionParam = searchParams.get('section');

    const formattedJobs = jobs.map(job => {
      let displayStatus = 'Unknown';
      let isSurvey = false;
      let isActionable = true;
      let section = 'SURVEY';

      switch(job.status) {
        case 'NEW':
        case 'SITE_SURVEY':
          displayStatus = 'Site Survey Pending';
          isSurvey = true;
          isActionable = true;
          section = 'SURVEY';
          break;
        case 'SURVEY_SUBMITTED':
          displayStatus = 'Survey Submitted (Pending Review)';
          isSurvey = true;
          isActionable = false;
          section = 'SURVEY';
          break;
        case 'SURVEY_VERIFIED':
        case 'MATERIAL_ALLOCATED':
        case 'INSTALLATION_STARTED':
          displayStatus = 'Installation Ready';
          isSurvey = false;
          isActionable = true;
          section = 'INSTALLATION';
          break;
        case 'INSTALLATION_COMPLETED':
        case 'FINAL_VERIFICATION':
          displayStatus = 'Installation Completed';
          isSurvey = false;
          isActionable = false;
          section = 'INSTALLATION';
          break;
        case 'PROJECT_COMPLETED':
          displayStatus = 'Project Completed';
          isSurvey = false;
          isActionable = false;
          section = 'COMPLETED';
          break;
        default:
          displayStatus = job.status;
          isSurvey = false;
          isActionable = false;
          section = 'OTHER';
      }

      const createdDate = job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN') : 'N/A';
      const installDate = job.installation_date ? new Date(job.installation_date).toLocaleDateString('en-IN') : null;
      const formattedDate = installDate ? `Install Date: ${installDate}` : `Assigned: ${createdDate}`;

      return {
        id: job.id,
        job_id: job.project_id,
        customer_name: job.customer_name,
        address: job.site_address || 'Address pending',
        mobile: job.mobile,
        type: displayStatus,
        section: section,
        is_survey: isSurvey,
        is_actionable: isActionable,
        status: job.status,
        date: formattedDate,
        created_at: createdDate,
        installation_date: installDate,
        priority: 'High'
      };
    });

    let finalJobs = formattedJobs;
    if (sectionParam) {
      finalJobs = formattedJobs.filter(j => j.section === sectionParam.toUpperCase());
    }

    return NextResponse.json({ success: true, jobs: finalJobs });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
