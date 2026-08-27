import { NextRequest, NextResponse } from 'next/server';
import { orderDb } from '@/lib/db-helpers/orders';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const order_type = searchParams.get('order_type') as 'PROJECT' | 'RETAIL' | null;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;

    const orders = await orderDb.findAll({
      order_type: order_type || undefined,
      status,
      search,
      limit,
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      order_type,
      customer_id,
      customer_name,
      customer_mobile,
      delivery_address,
      vehicle_number,
      driver_name,
      driver_mobile,
      vehicle_photo_path,
      total_amount,
      items,
      serials,
      dispatchImmediately,
      user_id,
    } = body;

    if (!customer_name) {
      return NextResponse.json({ error: 'customer_name is required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one order item is required' }, { status: 400 });
    }

    const userId = user_id || 1;

    const orderId = await orderDb.create({
      order_type: order_type || 'RETAIL',
      customer_id: customer_id ? Number(customer_id) : undefined,
      customer_name,
      customer_mobile,
      delivery_address,
      vehicle_number,
      driver_name,
      driver_mobile,
      vehicle_photo_path,
      total_amount: Number(total_amount || 0),
      items: items.map((i: any) => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price || 0),
      })),
      serials: Array.isArray(serials)
        ? serials.map((s: any) => ({
            product_id: Number(s.product_id),
            serial_number: s.serial_number,
          }))
        : [],
      userId,
      dispatchImmediately: Boolean(dispatchImmediately),
    });

    return NextResponse.json({
      success: true,
      order_id: orderId,
      message: dispatchImmediately
        ? 'Order created and dispatched! Stock and serial numbers synced.'
        : 'Order created successfully!',
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}
