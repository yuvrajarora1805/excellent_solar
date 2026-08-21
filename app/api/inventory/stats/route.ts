import { NextResponse } from 'next/server';
import { productDb } from '@/lib/db-helpers/products';

export async function GET() {
  try {
    const stats = await productDb.getStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
