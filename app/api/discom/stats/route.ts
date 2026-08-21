import { NextResponse } from 'next/server';
import { discomDb } from '@/lib/db-helpers/discom';

export async function GET() {
  try {
    const stats = await discomDb.getStats();
    return NextResponse.json({ stats });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
