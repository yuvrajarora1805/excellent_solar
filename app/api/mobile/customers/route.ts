import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    // Fetch all customers, along with their linked project IDs if they exist
    const customersQuery = await query(`
      SELECT c.id, c.name, c.mobile, c.email, c.address, c.city, c.district, c.state, p.project_id, p.status
      FROM customers c
      LEFT JOIN projects p ON c.id = p.customer_id
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json({ success: true, customers: customersQuery });

  } catch (error) {
    console.error('Error fetching customers for mobile app:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
