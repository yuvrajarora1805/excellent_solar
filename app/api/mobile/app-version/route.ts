import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.4',
    version_code: 37,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Draft feature to Bookings\n• Added Photo Upload from Gallery in Bookings\n• Fixed API bugs and UI improvements',
  });
}
