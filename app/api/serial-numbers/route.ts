import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { serialNumberDb } from '@/lib/db-helpers/serial-numbers';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/serial-numbers - Get all serial numbers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const options = {
      product_id: searchParams.get('product_id') ? Number(searchParams.get('product_id')) : undefined,
      warehouse_id: searchParams.get('warehouse_id') ? Number(searchParams.get('warehouse_id')) : undefined,
      project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined,
      current_location: searchParams.get('current_location') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    // If search term is provided, use search instead
    const search = searchParams.get('search');
    if (search) {
      const results = await serialNumberDb.search(search);
      return NextResponse.json(results);
    }

    const serials = await serialNumberDb.findAll(options);
    return NextResponse.json(serials);
  } catch (error) {
    console.error('Error fetching serial numbers:', error);
    return NextResponse.json({ error: 'Failed to fetch serial numbers' }, { status: 500 });
  }
}

// POST /api/serial-numbers - Create new serial number
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Handle bulk creation
    if (body.items && Array.isArray(body.items)) {
      const ids = await serialNumberDb.bulkCreate(body.items);
      return NextResponse.json({ ids, count: ids.length }, { status: 201 });
    }

    // Single creation
    const serialId = await serialNumberDb.create(body);
    const serial = await serialNumberDb.findById(serialId);

    return NextResponse.json(serial, { status: 201 });
  } catch (error: any) {
    console.error('Error creating serial number:', error);
    return NextResponse.json({ error: error.message || 'Failed to create serial number' }, { status: 500 });
  }
}
