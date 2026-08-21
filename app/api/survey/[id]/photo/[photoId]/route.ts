import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const resolvedParams = await params;
    const surveyId = parseInt(resolvedParams.id);
    const photoId = parseInt(resolvedParams.photoId);
    const body = await request.json();

    const { status, reason } = body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (status === 'REJECTED' && !reason) {
      return NextResponse.json({ error: 'Reason required for rejection' }, { status: 400 });
    }

    await query(
      'UPDATE site_survey_photos SET status = ?, rejection_reason = ? WHERE id = ? AND site_survey_id = ?',
      [status, status === 'REJECTED' ? reason : null, photoId, surveyId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update photo status:', error);
    return NextResponse.json({ error: 'Failed to update photo status' }, { status: 500 });
  }
}
