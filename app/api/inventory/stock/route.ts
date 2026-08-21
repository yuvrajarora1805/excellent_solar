import { NextRequest, NextResponse } from 'next/server';
import { stockDb } from '@/lib/db-helpers/stock';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || undefined;
    const category = request.nextUrl.searchParams.get('category') || undefined;

    const stock = await stockDb.getStockSummary({ category });

    let filtered = stock;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = stock.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.product_code.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ stock: filtered });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
  }
}
