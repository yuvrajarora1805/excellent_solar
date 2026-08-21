import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { quotationDb } from '@/lib/db-helpers/quotations';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/quotations - Get all quotations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const options = {
      project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')) : undefined,
      status: (searchParams.get('status') as any) || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const quotations = await quotationDb.findAll(options);
    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST /api/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let quotationId: number;

    if (body.system_template_id) {
      // Create from template
      quotationId = await quotationDb.createFromTemplate(
        {
          ...body,
          quotation_date: new Date(body.quotation_date),
          valid_until: body.valid_until ? new Date(body.valid_until) : undefined,
        },
        Number(session.user.id)
      );
    } else {
      // Create custom quotation
      quotationId = await quotationDb.create(
        {
          ...body,
          quotation_date: new Date(body.quotation_date),
          valid_until: body.valid_until ? new Date(body.valid_until) : undefined,
        },
        Number(session.user.id)
      );
    }

    const quotation = await quotationDb.findById(quotationId);
    return NextResponse.json(quotation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to create quotation' }, { status: 500 });
  }
}
