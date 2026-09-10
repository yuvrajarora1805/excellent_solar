import { NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer_id, issue_category, issue_type, priority, description, created_by } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }
    if (!issue_category || !issue_type) {
      return NextResponse.json({ error: 'issue_category and issue_type are required' }, { status: 400 });
    }

    // Auto-generate ticket number: SVC-YYYYMMDD-XXXX
    const today = new Date();
    const datePart = today.getFullYear().toString()
      + String(today.getMonth() + 1).padStart(2, '0')
      + String(today.getDate()).padStart(2, '0');
    const countRes = await queryOne<{ count: number }>(
      "SELECT COUNT(*) as count FROM service_tickets WHERE DATE(created_at) = CURDATE()"
    );
    const seq = ((countRes?.count ?? 0) + 1).toString().padStart(4, '0');
    const ticketNumber = `SVC-${datePart}-${seq}`;

    // Get the project_id linked to this customer (if any)
    const project = await queryOne<{ id: number }>(
      'SELECT id FROM projects WHERE customer_id = ? ORDER BY id DESC LIMIT 1',
      [customer_id]
    );

    await execute(
      `INSERT INTO service_tickets
        (ticket_number, project_id, customer_id, issue_category, issue_type, priority, description, status, service_type, payment_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', 'FREE', 'NOT_APPLICABLE', ?)`,
      [
        ticketNumber,
        project?.id ?? null,
        customer_id,
        issue_category,
        issue_type,
        priority || 'NORMAL',
        description || '',
        created_by || 1,
      ]
    );

    return NextResponse.json({ success: true, ticket_number: ticketNumber });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Server error', details: String(error) }, { status: 500 });
  }
}
