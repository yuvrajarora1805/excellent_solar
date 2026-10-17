import { NextRequest, NextResponse } from 'next/server';
import { orderDb } from '@/lib/db-helpers/orders';
import { transaction } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await orderDb.findById(Number(id));
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Convert DECIMAL strings to numbers for mobile app compatibility (Dart expects num)
    if (order.items && Array.isArray(order.items)) {
      order.items = order.items.map((i: any) => ({
        ...i,
        unit_price: Number(i.unit_price || 0),
        line_total: Number(i.line_total || 0),
      }));
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
    const { status, items, user_id, order_type, customer_name, serials, dispatchImmediately, isDraftEdit } = body;

    const userId = user_id || 1;
    let message = 'Order updated successfully!';

    if (isDraftEdit) {
      // Full draft update
      await orderDb.updateDraft(Number(id), {
        ...body,
        userId
      });
      message = dispatchImmediately ? 'Order dispatched successfully!' : 'Draft order saved successfully!';
    } else {
      // Partial updates (e.g. from order details page)
      if (items && Array.isArray(items)) {
        await orderDb.updateItems(Number(id), items);
        message = 'Order items and prices updated!';
      }

      if (status) {
        await orderDb.updateStatus(Number(id), status, userId);
        message = `Order status updated to ${status}. Stock and serial status synced!`;
      }
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    const order = await orderDb.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft orders can be deleted' }, { status: 400 });
    }

    await transaction(async (conn) => {
      await conn.execute('DELETE FROM order_serials WHERE order_id = ?', [orderId]);
      await conn.execute('DELETE FROM order_items WHERE order_id = ?', [orderId]);
      await conn.execute('DELETE FROM orders WHERE id = ?', [orderId]);
    });

    return NextResponse.json({ success: true, message: 'Draft order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting draft order:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete draft order' }, { status: 500 });
  }
}

