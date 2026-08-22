import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/dashboard/customers - Get recent customers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const customers = await query(`
      SELECT
        c.id,
        c.name,
        c.mobile,
        c.city,
        c.created_at,
        p.status as project_status,
        p.project_id
      FROM customers c
      LEFT JOIN projects p ON c.id = p.customer_id
      ORDER BY c.created_at DESC
      LIMIT ${Number(limit)}
    `);

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
