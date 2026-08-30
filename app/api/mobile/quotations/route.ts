import { NextRequest, NextResponse } from 'next/server';
import { quotationDb } from '@/lib/db-helpers/quotations';
import { query } from '@/lib/db';
import { QuotationStatus } from '@/types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback_secret_for_development';

export const runtime = 'nodejs';

// POST /api/mobile/quotations - Create quotation from mobile marketing app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let userId = body.user_id ? Number(body.user_id) : (body.created_by ? Number(body.created_by) : 0);
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decoded: any = jwt.verify(token, JWT_SECRET);
          if (decoded && decoded.id) {
            userId = Number(decoded.id);
          }
        } catch (e) {
          console.warn('Could not decode token in quotation route:', e);
        }
      }
    }
    if (!userId) userId = 1;

    const customerName = body.customer_name || 'Customer';
    const projectId = body.project_id ? Number(body.project_id) : 1;
    const items = Array.isArray(body.items) ? body.items : [];
    const capacityKw = body.capacity_kw ? Number(body.capacity_kw) : 0;
    const systemType = body.system_type || 'ON_GRID';

    // Calculate subtotal from items
    let subtotal = 0;
    const formattedItems = items.map((i: any) => {
      const qty = Number(i.quantity || 1);
      const price = Number(i.unit_price || 0);
      const lineTotal = Number(i.line_total || qty * price);
      subtotal += lineTotal;
      return {
        product_id: i.product_id ? Number(i.product_id) : null,
        description: i.description || i.name || 'Solar Product',
        quantity: qty,
        unit: i.unit || 'Piece',
        unit_price: price,
        discount_amount: 0,
        tax_amount: 0,
        line_total: lineTotal,
        sort_order: 0,
        remarks: null,
      };
    });

    const discountAmount = Number(body.discount_amount || 0);
    const gstPercentage = Number(body.gst_percentage || 18);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = Math.round((taxableAmount * gstPercentage) / 100);
    const totalAmount = taxableAmount + gstAmount;

    // Find customer ID
    let customerId = body.customer_id;
    if (!customerId && body.mobile) {
      const custs = await query<any>('SELECT id FROM customers WHERE mobile = ? LIMIT 1', [body.mobile]);
      if (custs.length > 0) customerId = custs[0].id;
    }
    if (!customerId) {
      const defaultCust = await query<any>('SELECT id FROM customers LIMIT 1');
      customerId = defaultCust.length > 0 ? defaultCust[0].id : 1;
    }

    let customerAddress = 'Generated from Marketing Mobile App';
    if (projectId) {
      const pResult = await query<any>(
        'SELECT c.address, c.city, c.district, c.state FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?',
        [projectId]
      );
      if (pResult.length > 0) {
        const c = pResult[0];
        const fullAddr = [c.address, c.city, c.district, c.state].filter(Boolean).join(', ');
        if (fullAddr) customerAddress = fullAddr;
      }
    }

    const quotationId = await quotationDb.create(
      {
        project_id: projectId,
        customer_id: customerId,
        quotation_date: new Date(),
        valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
        system_type: systemType,
        capacity_kw: capacityKw,
        subtotal,
        discount_amount: discountAmount,
        discount_percentage: Number(body.discount_percentage || 0),
        gst_amount: gstAmount,
        gst_percentage: gstPercentage,
        total_amount: totalAmount,
        status: QuotationStatus.DRAFT,
        terms_conditions: body.terms || '1. Validity 15 Days. 2. 30% advance, 65% on delivery, 5% on completion.',
        remarks: body.remarks || customerAddress,
        created_by: userId,
        items: formattedItems,
      },
      userId
    );

    const quotation = await quotationDb.findById(quotationId);

    return NextResponse.json({
      success: true,
      message: 'Quotation generated successfully',
      quotation,
      pdf_url: `/api/quotations/${quotationId}/pdf`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error generating mobile quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate quotation' }, { status: 500 });
  }
}
