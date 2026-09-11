import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const orders = await query(`
      SELECT o.id, o.order_number as reference, 'Order' as type, o.status, o.created_at, c.name as customer_name, o.total_amount
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.status = 'DRAFT'
      ORDER BY o.created_at DESC
    `);

    const quotations = await query(`
      SELECT q.id, q.quotation_number as reference, 'Quotation' as type, q.status, q.created_at, c.name as customer_name, q.total_amount
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      WHERE q.status = 'DRAFT'
      ORDER BY q.created_at DESC
    `);

    const bookings = await query(`
      SELECT b.id, b.project_id as reference, 'Booking' as type, b.status, b.created_at, c.name as customer_name, b.system_size as total_amount
      FROM projects b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.status = 'DRAFT'
      ORDER BY b.created_at DESC
    `);

    return NextResponse.json({
      orders: orders || [],
      quotations: quotations || [],
      bookings: bookings || []
    });
  } catch (error) {
    console.error('Error fetching mobile drafts:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}
