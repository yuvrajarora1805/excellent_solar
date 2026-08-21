import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { warehouseDb } from '@/lib/db-helpers/serial-numbers';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/warehouses - Get all warehouses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const options = {
      status: searchParams.get('status') || undefined,
      warehouse_type: searchParams.get('warehouse_type') || undefined,
    };

    const warehouses = await warehouseDb.findAll(options);
    return NextResponse.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 });
  }
}

// POST /api/warehouses - Create new warehouse
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const warehouseId = await warehouseDb.create(body);

    const warehouse = await warehouseDb.findById(warehouseId);
    return NextResponse.json(warehouse, { status: 201 });
  } catch (error: any) {
    console.error('Error creating warehouse:', error);
    return NextResponse.json({ error: error.message || 'Failed to create warehouse' }, { status: 500 });
  }
}
