import { NextRequest, NextResponse } from 'next/server';
import { siteSurveyDb } from '@/lib/db-helpers/site-survey';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const surveys = await siteSurveyDb.findAll({ status });
    return NextResponse.json({ surveys });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}
