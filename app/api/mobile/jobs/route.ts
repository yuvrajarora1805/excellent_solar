import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerIdStr = searchParams.get('worker_id');

    if (!workerIdStr) {
      return NextResponse.json({ error: 'worker_id is required' }, { status: 400 });
    }

    const workerId = parseInt(workerIdStr);

    // Fetch user details to check role
    const user = await queryOne<{ id: number; role: string }>('SELECT id, role FROM users WHERE id = ?', [workerId]);
    const userRole = (user?.role || 'WORKER').toUpperCase();

    // Query jobs user-specifically with fallback if assigned_to column is pending migration
    let jobs: any[] = [];
    try {
      const sql = `
        SELECT DISTINCT
          p.id, p.project_id, p.status, p.site_address, p.created_at, p.installation_date,
          c.name as customer_name, c.mobile
        FROM projects p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN site_surveys ss ON ss.project_id = p.id
        LEFT JOIN installations inst ON inst.project_id = p.id
        WHERE p.status NOT IN ('PROJECT_COMPLETED')
          AND (
            ? = 'ADMIN'
            OR ? = 'MANAGER'
            OR (? = 'INSTALLATION' AND p.status IN (
              'SURVEY_SUBMITTED','SURVEY_VERIFIED','MATERIAL_ALLOCATED',
              'INSTALLATION_STARTED','INSTALLATION_COMPLETED','FINAL_VERIFICATION'
            ))
            OR (? = 'MARKETING' AND p.status IN ('NEW','SITE_SURVEY','SURVEY_SUBMITTED','SURVEY_VERIFIED'))
            OR (? = 'SALES' AND p.status IN ('NEW','SITE_SURVEY','SURVEY_SUBMITTED','SURVEY_VERIFIED'))
            OR p.created_by = ?
            OR p.assigned_to = ?
            OR ss.created_by = ?
            OR inst.created_by = ?
          )
        ORDER BY p.id DESC
      `;
      
      jobs = await query(sql, [
        userRole,
        userRole,
        userRole,
        userRole,
        userRole,
        workerId,
        workerId,
        workerId,
        workerId
      ]) as any[];
    } catch (dbErr: any) {
      // Fallback query if assigned_to column does not exist yet in legacy MySQL schema
      const fallbackSql = `
        SELECT DISTINCT
          p.id, p.project_id, p.status, p.site_address, p.created_at,
          c.name as customer_name, c.mobile
        FROM projects p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN site_surveys ss ON ss.project_id = p.id
        LEFT JOIN installations inst ON inst.project_id = p.id
        WHERE p.status NOT IN ('PROJECT_COMPLETED')
          AND (
            ? = 'ADMIN'
            OR ? = 'MANAGER'
            OR (? = 'INSTALLATION' AND p.status IN (
              'SURVEY_SUBMITTED','SURVEY_VERIFIED','MATERIAL_ALLOCATED',
              'INSTALLATION_STARTED','INSTALLATION_COMPLETED','FINAL_VERIFICATION'
            ))
            OR (? = 'MARKETING' AND p.status IN ('NEW','SITE_SURVEY','SURVEY_SUBMITTED','SURVEY_VERIFIED'))
            OR (? = 'SALES' AND p.status IN ('NEW','SITE_SURVEY','SURVEY_SUBMITTED','SURVEY_VERIFIED'))
            OR p.created_by = ?
            OR ss.created_by = ?
            OR inst.created_by = ?
          )
        ORDER BY p.id DESC
      `;
      jobs = await query(fallbackSql, [
        userRole,
        userRole,
        userRole,
        userRole,
        userRole,
        workerId,
        workerId,
        workerId
      ]) as any[];
    }


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
          displayStatus = 'Installation Pending (Survey Done)';
          isSurvey = false;
          isActionable = true;
          section = 'INSTALLATION';
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

    // Role-specific job section filtering
    if (userRole === 'MARKETING' || userRole === 'SALES') {
      // Marketing/Sales ONLY sees Site Survey jobs (with updated approval statuses)
      finalJobs = formattedJobs.filter(j => j.section === 'SURVEY');
    } else if (userRole === 'INSTALLATION' || userRole === 'WORKER') {
      // Installation workers ONLY see Installation jobs
      finalJobs = formattedJobs.filter(j => j.section === 'INSTALLATION');
    } else if (sectionParam) {
      finalJobs = formattedJobs.filter(j => j.section === sectionParam.toUpperCase());
    }

    return NextResponse.json({ success: true, jobs: finalJobs });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
