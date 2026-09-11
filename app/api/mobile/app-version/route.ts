import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.5',
    version_code: 38,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Draft feature to Bookings and Orders\n• UI fixes for Retail customer additions',
  });
}
