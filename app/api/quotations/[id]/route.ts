import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { quotationDb } from '@/lib/db-helpers/quotations';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/quotations/[id] - Get quotation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const quotation = await quotationDb.findById(Number(id));

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json({ error: 'Failed to fetch quotation' }, { status: 500 });
  }
}

// PUT /api/quotations/[id] - Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    await quotationDb.update(Number(id), body);
    const quotation = await quotationDb.findById(Number(id));

    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    return NextResponse.json({ error: error.message || 'Failed to update quotation' }, { status: 500 });
  }
}

// DELETE /api/quotations/[id] - Delete quotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await quotationDb.delete(Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return NextResponse.json({ error: 'Failed to delete quotation' }, { status: 500 });
  }
}
