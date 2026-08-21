import { NextResponse } from 'next/server';
import { projectDb } from '@/lib/db-helpers/projects';
import { productDb } from '@/lib/db-helpers/products';

export async function GET() {
  try {
    const projects = await projectDb.getStats();
    const inventory = await productDb.getStats();

    return NextResponse.json({
      projects,
      inventory,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
