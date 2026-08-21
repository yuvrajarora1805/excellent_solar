import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { serviceTicketDb } from '@/lib/db-helpers/service';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/service-tickets - Get all service tickets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const options = {
      project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined,
      customer_id: searchParams.get('customer_id') ? Number(searchParams.get('customer_id')) : undefined,
      status: (searchParams.get('status') as any) || undefined,
      priority: (searchParams.get('priority') as any) || undefined,
      assigned_to: searchParams.get('assigned_to') ? Number(searchParams.get('assigned_to')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const tickets = await serviceTicketDb.findAll(options);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching service tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

// POST /api/service-tickets - Create new service ticket
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const ticketId = await serviceTicketDb.create(body, Number(session.user.id));

    const ticket = await serviceTicketDb.findById(ticketId);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Error creating service ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to create ticket' }, { status: 500 });
  }
}
