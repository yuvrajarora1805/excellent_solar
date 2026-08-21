import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = Number(resolvedParams.id);
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if template exists
    const template = await queryOne('SELECT id FROM system_templates WHERE id = ?', [templateId]);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Get max sort_order
    const sortResult: any = await queryOne('SELECT MAX(sort_order) as max_sort FROM system_template_items WHERE system_template_id = ?', [templateId]);
    const nextSort = (sortResult?.max_sort || 0) + 1;

    // Insert item
    await execute(
      'INSERT INTO system_template_items (system_template_id, product_id, quantity, sort_order) VALUES (?, ?, ?, ?)',
      [templateId, product_id, quantity, nextSort]
    );

    return NextResponse.json({ success: true, message: 'Item added successfully' });
  } catch (error) {
    console.error('Error adding template item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
