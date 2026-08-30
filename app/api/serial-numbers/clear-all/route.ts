import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { execute, query } from '@/lib/db';

export const runtime = 'nodejs';

// DELETE /api/serial-numbers/clear-all?product_id=X
// Removes all serial numbers for a product and resets its stock to 0
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = request.nextUrl.searchParams.get('product_id');
    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    // Count how many we're deleting
    const countRes = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM product_serial_numbers WHERE product_id = ?',
      [productId]
    );
    const deletedCount = countRes[0]?.count || 0;

    // Delete all serial numbers for this product
    await execute(
      'DELETE FROM product_serial_numbers WHERE product_id = ?',
      [productId]
    );

    // Reset the product stock to 0
    await execute(
      'UPDATE products SET current_stock = 0 WHERE id = ?',
      [productId]
    );

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} serial numbers and reset stock to 0 for product ID ${productId}`,
      deletedCount,
    });
  } catch (error: any) {
    console.error('Error clearing serial numbers:', error);
    return NextResponse.json({ error: error.message || 'Failed to clear serial numbers' }, { status: 500 });
  }
}
