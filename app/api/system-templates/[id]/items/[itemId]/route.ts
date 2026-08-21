import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  try {
    const resolvedParams = await params;
    const templateId = Number(resolvedParams.id);
    const itemId = Number(resolvedParams.itemId);
    
    if (isNaN(templateId) || isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await execute(
      'DELETE FROM system_template_items WHERE id = ? AND system_template_id = ?',
      [itemId, templateId]
    );

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting template item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
