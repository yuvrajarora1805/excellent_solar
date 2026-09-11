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
      is_draft,
    } = body;

    if (!customer_name) {
      return NextResponse.json({ error: 'Dealer Name (customer_name) is required' }, { status: 400 });
    }

    let finalCustomerId = customer_id ? Number(customer_id) : null;

    if (!finalCustomerId) {
      // Check if a customer with this mobile already exists
      if (customer_mobile) {
        const existing: any = await query('SELECT id FROM customers WHERE mobile = ? LIMIT 1', [customer_mobile]);
        if (existing && existing.length > 0) {
          finalCustomerId = existing[0].id;
        }
      }

      // If still not found, auto-create
      if (!finalCustomerId) {
        try {
          const result = await execute(
            'INSERT INTO customers (name, mobile, address, city, district, state, customer_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [customer_name, customer_mobile || '', delivery_address || '', '', '', '', 'RETAIL']
          );
          finalCustomerId = (result as any).insertId;
        } catch (e: any) {
           // If it fails due to duplicate name/mobile race condition, try fetching it one more time
           if (e.code === 'ER_DUP_ENTRY') {
             const existing: any = await query('SELECT id FROM customers WHERE mobile = ? OR name = ? LIMIT 1', [customer_mobile, customer_name]);
             if (existing && existing.length > 0) {
               finalCustomerId = existing[0].id;
             } else {
               throw e;
             }
           } else {
             throw e;
           }
        }
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one product is required' }, { status: 400 });
    }

    const processedItems = [];
    for (const item of items) {
      let finalProductId = item.product_id;

      if (item.is_custom || !finalProductId) {
        // Insert a temporary/custom product so it can be tracked
        const code = `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const result = await execute(
          'INSERT INTO products (product_code, name, category, status, current_stock) VALUES (?, ?, ?, ?, ?)',
          [code, item.product_name || 'Custom Material', 'Custom Material', 'Active', 0]
        );
        finalProductId = (result as any).insertId;
      }

      processedItems.push({
        product_id: Number(finalProductId),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price || 0),
      });
    }

    // Create the requirement ticket as a pending order
    const orderId = await orderDb.create({
      order_type: 'RETAIL',
      customer_id: finalCustomerId || undefined,
      customer_name,
      customer_mobile: customer_mobile || '',
      delivery_address: delivery_address || '',
      total_amount: Number(total_amount || 0),
      items: processedItems,
      serials: [],
      userId: 1, // System or default admin
      dispatchImmediately: false,
      status: is_draft ? 'DRAFT' : 'PENDING_DISPATCH',
    });

    // Update reserved stock for each item only if not draft
    if (!is_draft) {
      for (const item of processedItems) {
        await execute(
          'UPDATE products SET reserved_stock = COALESCE(reserved_stock, 0) + ? WHERE id = ?',
          [Number(item.quantity), Number(item.product_id)]
        );
      }
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
