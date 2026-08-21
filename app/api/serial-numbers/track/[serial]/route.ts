import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { serialNumberDb } from '@/lib/db-helpers/serial-numbers';

// Configure runtime for Node.js (required for mysql2)
export const runtime = 'nodejs';

// GET /api/serial-numbers/track/[serial] - Track a serial number (get full history)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serial: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serial } = await params;
    const trackingInfo = await serialNumberDb.getTrackingInfo(serial);

    if (!trackingInfo) {
      return NextResponse.json({ error: 'Serial number not found' }, { status: 404 });
    }

    return NextResponse.json(trackingInfo);
  } catch (error) {
    console.error('Error tracking serial number:', error);
    return NextResponse.json({ error: 'Failed to track serial number' }, { status: 500 });
  }
}
