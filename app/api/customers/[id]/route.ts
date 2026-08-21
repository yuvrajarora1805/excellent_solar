import { NextRequest, NextResponse } from 'next/server';
import { customerDb } from '@/lib/db-helpers/customers';

// GET /api/customers/[id] - Get customer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const customer = await customerDb.findById(id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to fetch customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    const body = await request.json();

    // Validate required fields
    const required = ['name', 'mobile', 'address', 'city', 'district', 'state'];
    for (const field of required) {
      if (!body[field] || body[field].trim() === '') {
        return NextResponse.json(
          { error: `${field.replace('_', ' ')} is required` },
          { status: 400 }
        );
      }
    }

    // Validate mobile
    const mobile = body.mobile.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number format' },
        { status: 400 }
      );
    }

    // Check if mobile already exists for another customer
    const existing = await customerDb.findByMobile(mobile);
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: 'Another customer with this mobile number already exists' },
        { status: 409 }
      );
    }

    // Update customer
    await customerDb.update(id, {
      name: body.name,
      mobile: mobile,
      email: body.email || null,
      address: body.address,
      city: body.city,
      district: body.district,
      state: body.state,
    });

    const customer = await customerDb.findById(id);
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Failed to update customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 });
    }

    await customerDb.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete customer' },
      { status: 400 }
    );
  }
}
