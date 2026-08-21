import { NextRequest, NextResponse } from 'next/server';
import { customerDb } from '@/lib/db-helpers/customers';
import { ProjectStatus } from '@/types';

// GET /api/customers - List customers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;

    const [customers, total] = await Promise.all([
      customerDb.findAll({ limit, offset, search }),
      customerDb.count(search),
    ]);

    return NextResponse.json({ customers, total });
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST /api/customers - Create customer
export async function POST(request: NextRequest) {
  try {
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

    // Check if mobile already exists
    const existing = await customerDb.findByMobile(mobile);
    if (existing) {
      return NextResponse.json(
        { error: 'A customer with this mobile number already exists' },
        { status: 409 }
      );
    }

    // Create customer
    const id = await customerDb.create({
      name: body.name,
      mobile: mobile,
      email: body.email || null,
      address: body.address,
      city: body.city,
      district: body.district,
      state: body.state,
    });

    const reservationsRaw = body.reservations;
    let projectId = null;

    if (reservationsRaw) {
      try {
        const reservations = JSON.parse(reservationsRaw);
        if (Array.isArray(reservations) && reservations.length > 0) {
          // Create project
          const { projectDb } = await import('@/lib/db-helpers/projects');
          const { reservationDb } = await import('@/lib/db-helpers/reservations');

          const projId = await projectDb.create({
            customer_id: id,
            status: ProjectStatus.NEW,
            created_by: 1, // session user
            site_address: body.address,
          });
          
          projectId = projId;
          await reservationDb.createBatch(projId, reservations, 1);
        }
      } catch (e) {
        console.error('Failed to create project/reservations for new customer:', e);
      }
    }

    const customer = await customerDb.findById(id);
    return NextResponse.json({ ...customer, project_id: projectId }, { status: 201 });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
