import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard/jobs - Get jobs for worker dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'today', 'upcoming', 'completed'

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let sql = '';
    let params: any[] = [];

    if (type === 'today') {
      sql = `
        SELECT
          p.id,
          p.project_id,
          c.name as customer,
          c.mobile as phone,
          c.address,
          c.city as location,
          ss.status as survey_status,
          i.status as installation_status,
          p.capacity,
          u.name as worker_name
        FROM projects p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN site_surveys ss ON p.id = ss.project_id AND ss.created_by = ?
        LEFT JOIN installations i ON p.id = i.project_id AND i.created_by = ?
        LEFT JOIN users u ON (ss.created_by = u.id OR i.created_by = u.id)
        WHERE (ss.created_by = ? OR i.created_by = ?)
        AND (ss.status IN ('DRAFT', 'SUBMITTED') OR i.status IN ('DRAFT', 'SUBMITTED'))
        ORDER BY p.created_at DESC
      `;
      params = [userId, userId, userId, userId];
    } else if (type === 'upcoming') {
      sql = `
        SELECT
          p.id,
          p.project_id,
          c.name as customer,
          c.city as location,
          p.survey_date,
          p.installation_date,
          ss.status as survey_status,
          i.status as installation_status
        FROM projects p
        JOIN customers c ON p.customer_id = c.id
        LEFT JOIN site_surveys ss ON p.id = ss.project_id
        LEFT JOIN installations i ON p.id = i.project_id
        WHERE (ss.created_by = ? OR i.created_by = ?)
        AND (ss.status IN ('DRAFT') OR i.status IN ('DRAFT'))
        AND (p.survey_date >= CURDATE() OR p.installation_date >= CURDATE())
        ORDER BY COALESCE(p.survey_date, p.installation_date)
      `;
      params = [userId, userId];
    } else if (type === 'completed') {
      sql = `
        SELECT
          p.id,
          p.project_id,
          c.name as customer,
          c.city as location,
          ss.updated_at as completed,
          'survey' as type
        FROM projects p
        JOIN customers c ON p.customer_id = c.id
        JOIN site_surveys ss ON p.id = ss.project_id
        WHERE ss.created_by = ? AND ss.status = 'VERIFIED'
        AND ss.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

        UNION ALL

        SELECT
          p.id,
          p.project_id,
          c.name as customer,
          c.city as location,
          i.updated_at as completed,
          'installation' as type
        FROM projects p
        JOIN customers c ON p.customer_id = c.id
        JOIN installations i ON p.id = i.project_id
        WHERE i.created_by = ? AND i.status = 'VERIFIED'
        AND i.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

        ORDER BY completed DESC
      `;
      params = [userId, userId];
    }

    const jobs = await query(sql, params);

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
