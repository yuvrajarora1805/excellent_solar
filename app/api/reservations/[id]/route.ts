import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { reservationDb } from '@/lib/db-helpers/reservations';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/reservations/[id] - Get reservation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const reservation = await reservationDb.findById(Number(id));

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 });
  }
}

// PUT /api/reservations/[id] - Update reservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await reservationDb.update(Number(id), body);
    const reservation = await reservationDb.findById(Number(id));

    return NextResponse.json(reservation);
  } catch (error: any) {
    console.error('Error updating reservation:', error);
    return NextResponse.json({ error: error.message || 'Failed to update reservation' }, { status: 500 });
  }
}

// DELETE /api/reservations/[id] - Delete reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await reservationDb.delete(Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 });
  }
}
