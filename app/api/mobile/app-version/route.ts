import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.2',
    version_code: 35,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Complete Retail Order Flow: Create new retail requirements from the app\n• Fixed API bugs and UI improvements',
  });
}
