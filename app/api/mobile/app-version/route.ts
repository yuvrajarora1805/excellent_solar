import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.7',
    version_code: 39,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Draft feature to Bookings and Orders\n• UI fixes for Retail customer additions\n• Edit orders via web dashboard',
  });
}
