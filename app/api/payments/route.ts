import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { paymentDb, paymentScheduleDb } from '@/lib/db-helpers/payments';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/payments - Get all payments
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const options = {
      project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined,
      payment_method: (searchParams.get('payment_method') as any) || undefined,
      status: (searchParams.get('status') as any) || undefined,
      from_date: searchParams.get('from_date') ? new Date(searchParams.get('from_date')!) : undefined,
      to_date: searchParams.get('to_date') ? new Date(searchParams.get('to_date')!) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const payments = await paymentDb.findAll(options);
    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

// POST /api/payments - Create new payment
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const paymentId = await paymentDb.create(
      {
        ...body,
        payment_date: new Date(body.payment_date),
      },
      Number(session.user.id)
    );

    const payment = await paymentDb.findById(paymentId);
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment' }, { status: 500 });
  }
}
