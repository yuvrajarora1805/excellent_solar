import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { systemTemplateDb } from '@/lib/db-helpers/system-templates';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/system-templates - Get all templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const options = {
      system_type: searchParams.get('system_type') || undefined,
      capacity_kw: searchParams.get('capacity_kw') ? Number(searchParams.get('capacity_kw')) : undefined,
      status: searchParams.get('status') || undefined,
    };

    const templates = await systemTemplateDb.findAll(options);
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching system templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/system-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const templateId = await systemTemplateDb.create(body, 1);

    const template = await systemTemplateDb.findById(templateId);
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Error creating system template:', error);
    return NextResponse.json({ error: error.message || 'Failed to create template' }, { status: 500 });
  }
}

