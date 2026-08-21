import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { reservationDb } from '@/lib/db-helpers/reservations';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// POST /api/reservations/[id]/actions/reserve - Reserve items (check availability and reserve)
export async function POST(
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
    const action = body.action;

    let result;

    switch (action) {
      case 'reserve':
        result = await reservationDb.reserveItems(Number(id));
        break;

      case 'release':
        await reservationDb.release(Number(id));
        result = { success: true, message: 'Reservation released' };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error performing reservation action:', error);
    return NextResponse.json({ error: error.message || 'Failed to perform action' }, { status: 500 });
  }
}
