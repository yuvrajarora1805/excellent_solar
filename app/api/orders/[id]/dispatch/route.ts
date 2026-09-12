import { NextRequest, NextResponse } from 'next/server';
import { orderDb } from '@/lib/db-helpers/orders';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { serials, vehicle_number, driver_name, driver_mobile, vehicle_photo_path, user_id } = body;

    const ticketId = Number(id);
    const userId = user_id || 1; // Fallback to 1 if not provided

    if (!serials || !Array.isArray(serials)) {
      return NextResponse.json({ error: 'serials array is required' }, { status: 400 });
    }

    await orderDb.dispatchTicket(ticketId, {
      vehicle_number,
      driver_name,
      driver_mobile,
      vehicle_photo_path,
      serials,
      userId
    });

    return NextResponse.json({ success: true, message: 'Order dispatched successfully!' });
  } catch (error: any) {
    console.error('Error dispatching order:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch order' }, { status: 500 });
  }
}
