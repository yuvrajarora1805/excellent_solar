import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { reservationDb } from '@/lib/db-helpers/reservations';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/reservations - Get all reservations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    
    if (projectId) {
      const reservations = await reservationDb.findByProject(Number(projectId));
      return NextResponse.json(reservations);
    } else {
      const options = {
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
        offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      };
      const reservations = await reservationDb.findAll(options);
      return NextResponse.json(reservations);
    }
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

// POST /api/reservations - Create new reservation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const reservationId = await reservationDb.create(
      {
        ...body,
        reservation_date: new Date(body.reservation_date),
      },
      Number(session.user.id)
    );

    const reservation = await reservationDb.findById(reservationId);
    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create reservation' }, { status: 500 });
  }
}
