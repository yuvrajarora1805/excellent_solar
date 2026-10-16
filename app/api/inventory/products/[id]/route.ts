import { NextRequest, NextResponse } from 'next/server';
import { productDb } from '@/lib/db-helpers/products';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const product = await productDb.findById(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();

    await productDb.update(id, body);
    const product = await productDb.findById(id);
    return NextResponse.json(product);
  } catch (error: any) {
    console.error(`Error updating product ${params}:`, error);
    return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const { query, execute } = await import('@/lib/db');

    // Check if product is referenced in existing orders
    const orderItems: any = await query(
      'SELECT id FROM order_items WHERE product_id = ? LIMIT 1',
      [id]
    );

    if (orderItems && orderItems.length > 0) {
      // Instead of hard delete which breaks foreign key relations, mark status as INACTIVE/ARCHIVED
      await execute('UPDATE products SET status = "INACTIVE" WHERE id = ?', [id]);
      return NextResponse.json({ 
        success: true, 
        message: 'Product is linked to order history and has been marked INACTIVE instead of deleting.' 
      });
    }

    // Clean up related inventory serials / product serials if unassigned
    await execute('DELETE FROM product_serial_numbers WHERE product_id = ? AND status != "ISSUED"', [id]).catch(() => {});
    await execute('DELETE FROM inventory_serials WHERE product_id = ? AND status != "ISSUED"', [id]).catch(() => {});
    await execute('DELETE FROM stock_reservations WHERE product_id = ?', [id]).catch(() => {});

    try {
      await productDb.delete(id);
    } catch (dbErr: any) {
      // Fallback: If still referenced by any other constraint, soft delete
      await execute('UPDATE products SET status = "INACTIVE" WHERE id = ?', [id]);
      return NextResponse.json({ 
        success: true, 
        message: 'Product archived as INACTIVE due to historical references.' 
      });
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete product' }, { status: 500 });
  }
}
