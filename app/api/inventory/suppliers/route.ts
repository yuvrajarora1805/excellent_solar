import { NextRequest, NextResponse } from 'next/server';
import { supplierDb } from '@/lib/db-helpers/purchases';

export async function GET() {
  try {
    const suppliers = await supplierDb.findAll();
    return NextResponse.json({ suppliers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }

    const id = await supplierDb.create(body);
    const supplier = await supplierDb.findById(id);
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
