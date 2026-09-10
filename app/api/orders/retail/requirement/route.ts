import { NextRequest, NextResponse } from 'next/server';
import { orderDb } from '@/lib/db-helpers/orders';
import { query, execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customer_id,
      customer_name,
      customer_mobile,
      delivery_address,
      total_amount,
      items,
    } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one product is required' }, { status: 400 });
    }

    // Create the requirement ticket as a pending order
    const orderId = await orderDb.create({
      order_type: 'RETAIL',
      customer_id: Number(customer_id),
      customer_name,
      customer_mobile,
      delivery_address,
      total_amount: Number(total_amount || 0),
      items: items.map((i: any) => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price || 0),
      })),
      serials: [],
      userId: 1, // System or default admin
      dispatchImmediately: false,
      status: 'PENDING_DISPATCH',
    });

    // Update reserved stock for each item
    for (const item of items) {
      await execute(
        'UPDATE products SET reserved_stock = COALESCE(reserved_stock, 0) + ? WHERE id = ?',
        [Number(item.quantity), Number(item.product_id)]
      );
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      message: 'Retail requirement ticket created and stock reserved successfully!',
    });
  } catch (error: any) {
    console.error('Error creating retail requirement ticket:', error);
    return NextResponse.json({ error: error.message || 'Failed to create requirement ticket' }, { status: 500 });
  }
}
