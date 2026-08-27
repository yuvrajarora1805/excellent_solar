import { NextRequest, NextResponse } from 'next/server';
import { supplierDb } from '@/lib/db-helpers/purchases';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const supplier = await supplierDb.findById(id);
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
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

    await supplierDb.update(id, body);
    const supplier = await supplierDb.findById(id);
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await supplierDb.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete supplier' }, { status: 400 });
  }
}
