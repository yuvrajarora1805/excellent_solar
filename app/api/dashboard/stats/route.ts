import { query, queryOne } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'ADMIN';

    let stats = {};

    if (role === 'ADMIN') {
      // Admin stats - full overview
      const [newLeads] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM customers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );

      const [activeJobs] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM projects WHERE status NOT IN ('PROJECT_COMPLETED', 'CANCELLED')"
      );

      const [installsThisMonth] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM projects WHERE installation_date >= DATE_FORMAT(NOW(), "%Y-%m-01")'
      );

      const [pendingDiscom] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status IN ('JE_PENDING', 'SDO_PENDING', 'XEN_PENDING', 'DOCUMENTS_PENDING')"
      );

      const [activeUsers] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE active = 1'
      );

      const [monthlyRevenue] = await query<{ total: number }>(
        'SELECT SUM(total_amount) as total FROM quotations WHERE status = "ACCEPTED" AND created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")'
      );

      const [todaySurveys] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM projects WHERE status IN ("SITE_SURVEY", "SURVEY_SUBMITTED")'
      );

      const [todayInstalls] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM projects WHERE status IN ("MATERIAL_ALLOCATED", "INSTALLATION_STARTED", "INSTALLATION_COMPLETED")'
      );

      const [todayDiscom] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status IN ('JE_PENDING', 'SDO_PENDING', 'XEN_PENDING')"
      );

      stats = {
        newLeads: newLeads?.count || 0,
        activeJobs: activeJobs?.count || 0,
        installsThisMonth: installsThisMonth?.count || 0,
        pendingDiscom: pendingDiscom?.count || 0,
        activeUsers: activeUsers?.count || 0,
        monthlyRevenue: monthlyRevenue?.total || 0,
        schedule: {
          surveys: todaySurveys?.count || 0,
          installations: todayInstalls?.count || 0,
          discomTasks: todayDiscom?.count || 0
        }
      };
    } else if (role === 'SALES') {
      // Sales stats
      const [newLeads] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM customers WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );

      const [pendingQuotes] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM quotations WHERE status = 'DRAFT'"
      );

      const [quotesSent] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM quotations WHERE status = 'SENT' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
      );

      const [scheduledSurveys] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM projects WHERE status = "SITE_SURVEY" AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      );

      stats = {
        newLeads: newLeads?.count || 0,
        pendingQuotes: pendingQuotes?.count || 0,
        quotesSent: quotesSent?.count || 0,
        scheduledSurveys: scheduledSurveys?.count || 0,
      };
    } else if (role === 'WORKER') {
      // Worker stats
      const userId = searchParams.get('userId');

      if (!userId) {
        return NextResponse.json({ error: 'User ID required for worker stats' }, { status: 400 });
      }

      const [todaySurveys] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM site_surveys ss JOIN projects p ON ss.project_id = p.id WHERE ss.created_by = ? AND DATE(ss.created_at) = CURDATE()',
        [userId]
      );

      const [todayInstallations] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM installations i JOIN projects p ON i.project_id = p.id WHERE i.created_by = ? AND DATE(i.created_at) = CURDATE()',
        [userId]
      );

      const [weekTotal] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM site_surveys ss JOIN projects p ON ss.project_id = p.id WHERE ss.created_by = ? AND ss.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
        [userId]
      );

      const [completedThisWeek] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM site_surveys ss JOIN projects p ON ss.project_id = p.id WHERE ss.created_by = ? AND ss.status = 'VERIFIED' AND ss.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [userId]
      );

      stats = {
        todaySurveys: todaySurveys?.count || 0,
        todayInstallations: todayInstallations?.count || 0,
        weekTotal: weekTotal?.count || 0,
        completedThisWeek: completedThisWeek?.count || 0,
      };
    } else if (role === 'DISCOM_OPERATOR') {
      // DISCOM stats
      const [totalApplications] = await query<{ count: number }>(
        'SELECT COUNT(*) as count FROM discom_applications'
      );

      const [pendingDocuments] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'DOCUMENTS_PENDING'"
      );

      const [submitted] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'SUBMITTED_TO_DISCOM'"
      );

      const [jePending] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'JE_PENDING'"
      );

      const [sdoPending] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'SDO_PENDING'"
      );

      const [xenPending] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'XEN_PENDING'"
      );

      const [estimateGenerated] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'ESTIMATE_GENERATED'"
      );

      const [feePaid] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'FEE_PAID'"
      );

      const [approved] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'APPROVED' AND completed_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
      );

      const [rejected] = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM discom_applications WHERE status = 'REJECTED' AND completed_at >= DATE_FORMAT(NOW(), '%Y-%m-01')"
      );

      stats = {
        totalApplications: totalApplications?.count || 0,
        pendingDocuments: pendingDocuments?.count || 0,
        submitted: submitted?.count || 0,
        jePending: jePending?.count || 0,
        sdoPending: sdoPending?.count || 0,
        xenPending: xenPending?.count || 0,
        estimateGenerated: estimateGenerated?.count || 0,
        feePaid: feePaid?.count || 0,
        approved: approved?.count || 0,
        rejected: rejected?.count || 0,
      };
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
