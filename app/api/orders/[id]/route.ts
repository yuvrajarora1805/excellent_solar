import { NextRequest, NextResponse } from 'next/server';
import { orderDb } from '@/lib/db-helpers/orders';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await orderDb.findById(Number(id));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, items, user_id } = body;

    const userId = user_id || 1;
    let message = 'Order updated successfully!';

    if (items && Array.isArray(items)) {
      await orderDb.updateItems(Number(id), items);
      message = 'Order items and prices updated!';
    }

    if (status) {
      await orderDb.updateStatus(Number(id), status, userId);
      message = `Order status updated to ${status}. Stock and serial status synced!`;
    }

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 });
  }
}
