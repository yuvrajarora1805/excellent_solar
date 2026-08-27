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
  } catch (error: any) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch quotations' }, { status: 500 });
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

    if (!body.project_id || !body.quotation_date) {
      return NextResponse.json({ error: 'project_id and quotation_date are required' }, { status: 400 });
    }

    let quotationId: number;

    const baseData = {
      ...body,
      project_id: Number(body.project_id),
      quotation_date: new Date(body.quotation_date),
      valid_until: body.valid_until ? new Date(body.valid_until) : undefined,
      discount_percentage: Number(body.discount_percentage || 0),
      gst_percentage: Number(body.gst_percentage || 18),
      status: body.status || 'DRAFT',
    };

    if (body.system_template_id) {
      // Create from template
      quotationId = await quotationDb.createFromTemplate(
        { ...baseData, system_template_id: Number(body.system_template_id) },
        Number(session.user.id)
      );
    } else {
      // Create custom quotation — items default to empty array
      const items = Array.isArray(body.items) ? body.items.map((i: any) => ({
        product_id: i.product_id || null,
        description: i.description || '',
        quantity: Number(i.quantity || 1),
        unit: i.unit || 'Piece',
        unit_price: Number(i.unit_price || 0),
        discount_amount: Number(i.discount_amount || 0),
        tax_amount: Number(i.tax_amount || 0),
        line_total: Number(i.line_total || (i.quantity || 1) * (i.unit_price || 0)),
        sort_order: Number(i.sort_order || 0),
        remarks: i.remarks || null,
      })) : [];

      quotationId = await quotationDb.create(
        { ...baseData, items },
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
