import { NextRequest, NextResponse } from 'next/server';
import { purchaseDb } from '@/lib/db-helpers/purchases';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const purchase = await purchaseDb.findById(id);
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchase' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await purchaseDb.delete(id, 1);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete purchase' }, { status: 500 });
  }
}
