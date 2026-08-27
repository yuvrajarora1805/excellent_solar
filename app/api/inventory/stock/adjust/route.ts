import { NextRequest, NextResponse } from 'next/server';
import { stockDb } from '@/lib/db-helpers/stock';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, new_quantity, reason } = body;

    if (!product_id || new_quantity === undefined || !reason) {
      return NextResponse.json({ error: 'product_id, new_quantity, and reason are required' }, { status: 400 });
    }

    // Default to user ID 1
    await stockDb.adjustStock(
      Number(product_id),
      Number(new_quantity),
      reason,
      1
    );

    return NextResponse.json({ success: true, message: 'Stock updated successfully' });
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to adjust stock' }, { status: 500 });
  }
}
