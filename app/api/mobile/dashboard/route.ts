import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json({ error: 'worker_id is required' }, { status: 400 });
    }

    // Since we don't have assigned_to fully integrated, we'll fetch system-wide metrics for demonstration
    const surveysQuery = await query("SELECT COUNT(*) as count FROM projects WHERE status IN ('NEW', 'SITE_SURVEY')");
    const installsQuery = await query("SELECT COUNT(*) as count FROM projects WHERE status IN ('MATERIAL_ALLOCATED', 'INSTALLATION_STARTED')");
    const completedQuery = await query("SELECT COUNT(*) as count FROM projects WHERE status = 'PROJECT_COMPLETED'");
    const openTicketsQuery = await query("SELECT COUNT(*) as count FROM service_tickets WHERE status != 'CLOSED'");
    const closedTicketsQuery = await query("SELECT COUNT(*) as count FROM service_tickets WHERE status = 'CLOSED'");
    const totalJobsQuery = await query("SELECT COUNT(*) as count FROM projects");

    // DISCOM Metrics
    const totalDiscomQuery = await query("SELECT COUNT(*) as count FROM discom_applications");
    const pendingJeQuery = await query("SELECT COUNT(*) as count FROM je_verifications WHERE status = 'PENDING'");
    const pendingSdoQuery = await query("SELECT COUNT(*) as count FROM sdo_verifications WHERE status = 'PENDING'");
    const pendingXenQuery = await query("SELECT COUNT(*) as count FROM xen_verifications WHERE status = 'PENDING'");
    const pendingSecondQuery = await query("SELECT COUNT(*) as count FROM discom_applications WHERE status IN ('FEE_PENDING', 'PORTAL_UPDATE_PENDING')");

    const stats = {
      pendingSurveys: (surveysQuery as any[])[0]?.count || 0,
      activeInstalls: (installsQuery as any[])[0]?.count || 0,
      completedJobs: (completedQuery as any[])[0]?.count || 0,
      openTickets: (openTicketsQuery as any[])[0]?.count || 0,
      closedTickets: (closedTicketsQuery as any[])[0]?.count || 0,
      totalJobs: (totalJobsQuery as any[])[0]?.count || 0,
      totalDiscom: (totalDiscomQuery as any[])[0]?.count || 0,
      pendingJe: (pendingJeQuery as any[])[0]?.count || 0,
      pendingSdo: (pendingSdoQuery as any[])[0]?.count || 0,
      pendingXen: (pendingXenQuery as any[])[0]?.count || 0,
      pendingSecondApproval: (pendingSecondQuery as any[])[0]?.count || 0,
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
