import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'ADMIN';

    // 1. Revenue trend: Sum of ACCEPTED quotation totals per month over the last 6 months
    const revenueData = await query<any>(`
      SELECT 
        DATE_FORMAT(quotation_date, '%Y-%m') as month,
        SUM(total_amount) as revenue
      FROM quotations
      WHERE status = 'ACCEPTED'
        AND quotation_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(quotation_date, '%Y-%m')
      ORDER BY month ASC
    `);

    // Format revenue data (e.g., '2026-08' -> 'Aug 2026')
    const formattedRevenue = revenueData.map((row: any) => {
      const [year, monthStr] = row.month.split('-');
      const date = new Date(parseInt(year), parseInt(monthStr) - 1);
      return {
        name: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: Number(row.revenue) || 0
      };
    });

    // 2. Project Status Distribution: Count of projects grouped by status
    const statusData = await query<any>(`
      SELECT status, COUNT(*) as count
      FROM projects
      WHERE status NOT IN ('PROJECT_COMPLETED', 'CANCELLED')
      GROUP BY status
    `);

    // Format status labels
    const formatStatus = (s: string) => {
      return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formattedStatus = statusData.map((row: any) => ({
      name: formatStatus(row.status),
      value: row.count
    }));

    return NextResponse.json({
      revenue: formattedRevenue,
      projectStatus: formattedStatus
    });

  } catch (error: any) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }
}
