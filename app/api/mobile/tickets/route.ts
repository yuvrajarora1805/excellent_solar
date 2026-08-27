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

    // Query tickets user-specifically
    const sql = `
      SELECT 
        t.id, t.ticket_number, t.issue_category, t.issue_type, t.priority, t.description, t.status, t.created_at, t.resolution,
        c.name as customer_name, c.mobile, c.address as site_address
      FROM service_tickets t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.status NOT IN ('CLOSED')
        AND (
          ? = 'ADMIN'
          OR ? = 'MANAGER'
          OR t.assigned_to = ?
          OR t.created_by = ?
          OR t.assigned_to IS NULL
        )
      ORDER BY t.created_at DESC
    `;
    
    const tickets = await query(sql, [userRole, userRole, workerId, workerId]) as any[];

    const formattedTickets = tickets.map(t => {
      const formattedDate = t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : 'N/A';
      return {
        id: t.id,
        ticket_number: t.ticket_number,
        customer_name: t.customer_name,
        address: t.site_address,
        mobile: t.mobile,
        issue_category: t.issue_category,
        issue_type: t.issue_type,
        description: t.description,
        resolution: t.resolution,
        priority: t.priority,
        status: t.status,
        date: formattedDate,
        created_at: formattedDate,
      };
    });

    return NextResponse.json({ success: true, tickets: formattedTickets });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
