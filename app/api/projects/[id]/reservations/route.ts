import { NextRequest, NextResponse } from 'next/server';
import { reservationDb } from '@/lib/db-helpers/reservations';

// GET /api/projects/[id]/reservations
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const projectId = parseInt(idStr);
    const reservations = await reservationDb.findByProject(projectId);
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}

// POST /api/projects/[id]/reservations — create/update reservations
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const projectId = parseInt(idStr);
    const body = await request.json();
    const { items, reserved_by = 1 } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array is required' }, { status: 400 });
    }

    await reservationDb.createBatch(projectId, items, reserved_by);
    const reservations = await reservationDb.findByProject(projectId);
    return NextResponse.json({ success: true, reservations }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reservations:', error);
    return NextResponse.json({ error: error.message || 'Failed to create reservations' }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/reservations — release all or one reservation
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const projectId = parseInt(idStr);
    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');

    if (reservationId) {
      await reservationDb.releaseOne(parseInt(reservationId));
    } else {
      await reservationDb.releaseAll(projectId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error releasing reservations:', error);
    return NextResponse.json({ error: 'Failed to release reservations' }, { status: 500 });
  }
}
