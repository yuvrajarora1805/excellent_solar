import { NextRequest, NextResponse } from 'next/server';
import { discomDb } from '@/lib/db-helpers/discom';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workerId = searchParams.get('worker_id');

    if (!workerId) {
      return NextResponse.json({ error: 'worker_id is required' }, { status: 400 });
    }

    const applications = await discomDb.findAll();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching mobile discom applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
