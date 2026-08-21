import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const surveyId = parseInt(resolvedParams.id);

    await query(
      'UPDATE site_survey_photos SET status = ? WHERE site_survey_id = ? AND status = ?',
      ['APPROVED', surveyId, 'PENDING']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update photos status:', error);
    return NextResponse.json({ error: 'Failed to update photos status' }, { status: 500 });
  }
}
