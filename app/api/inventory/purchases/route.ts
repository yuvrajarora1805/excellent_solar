import { NextRequest, NextResponse } from 'next/server';
import { purchaseDb } from '@/lib/db-helpers/purchases';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;

    const [purchases, total] = await Promise.all([
      purchaseDb.findAll({ limit, offset, search }),
      purchaseDb.count({ search }),
    ]);

    return NextResponse.json({ purchases, total });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.supplier_id || !body.invoice_number || !body.invoice_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    const id = await purchaseDb.createWithItems(
      {
        supplier_id: body.supplier_id,
        invoice_number: body.invoice_number,
        invoice_date: new Date(body.invoice_date),
        total_amount: body.total_amount,
        remarks: body.remarks,
        created_by: 1,
      },
      body.items,
      1
    );

    const purchase = await purchaseDb.findById(id);
    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create purchase' }, { status: 500 });
  }
}
