import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { systemTemplateDb } from '@/lib/db-helpers/system-templates';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/system-templates/[id] - Get template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {


    const { id } = await params;
    const template = await systemTemplateDb.findById(Number(id));

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching system template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/system-templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await systemTemplateDb.update(Number(id), body);
    const template = await systemTemplateDb.findById(Number(id));

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error updating system template:', error);
    return NextResponse.json({ error: error.message || 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/system-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await systemTemplateDb.delete(Number(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting system template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}

