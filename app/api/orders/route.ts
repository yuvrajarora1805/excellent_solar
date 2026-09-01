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

      // Mobile app bug workaround: The mobile app hardcodes product_id = 1.
      // We must look up the real product_id using the serial number.
      let finalItems = items;
      let finalSerials = serials || [];

      if (Array.isArray(serials) && serials.length > 0) {
        console.log("Original serials received from mobile app:", JSON.stringify(serials));
        const { query } = await import('@/lib/db');
        
        // Clean and trim the serial numbers just in case there's whitespace
        const serialNumbers = serials.map(s => String(s.serial_number || '').trim());
        console.log("Cleaned serial numbers for DB lookup:", serialNumbers);
        
        // Fetch real product_id for all scanned serials
        const placeholders = serialNumbers.map(() => '?').join(',');
        const serialRows: any = await query(
          `SELECT ps.serial_number, ps.product_id, p.selling_price 
           FROM product_serial_numbers ps 
           JOIN products p ON ps.product_id = p.id 
           WHERE ps.serial_number IN (${placeholders})`,
          serialNumbers
        );
        console.log("DB lookup returned:", JSON.stringify(serialRows));

        if (serialRows && serialRows.length > 0) {
          // Map serial number to its product_id
          const serialMap = new Map();
          for (const row of serialRows) {
            serialMap.set(row.serial_number, {
              product_id: row.product_id,
              selling_price: row.selling_price
            });
          }

          // Build final serials array
          finalSerials = serials.map((s: any) => {
            const realData = serialMap.get(s.serial_number);
            if (!realData) {
              throw new Error(`Serial number ${s.serial_number} not found in inventory.`);
            }
            return {
              product_id: realData.product_id,
              serial_number: s.serial_number,
            };
          });

          // Build final items array grouped by product_id
          const itemsMap = new Map();
          for (const s of finalSerials) {
            const pId = s.product_id;
            if (!itemsMap.has(pId)) {
               const pData = serialMap.get(s.serial_number);
               itemsMap.set(pId, {
                 product_id: pId,
                 quantity: 0,
                 unit_price: Number(pData.selling_price || items[0]?.unit_price || 0)
               });
            }
            itemsMap.get(pId).quantity += 1;
          }
          finalItems = Array.from(itemsMap.values());
        } else {
          throw new Error("None of the scanned serial numbers were found in inventory.");
        }
      } else {
        // If no serials are provided, just sanitize items
        finalItems = items.map((i: any) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price || 0),
        }));
      }

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
        items: finalItems,
        serials: finalSerials,
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
