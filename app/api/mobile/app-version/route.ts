import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.11',
    version_code: 44,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed bug with Save Draft and submitting unregistered vs registered dealers\n• Fixed stock item sync when upgrading draft orders',
  });
}
