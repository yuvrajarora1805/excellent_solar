import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.5.0',
    version_code: 6,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Updated Branding Logo & App Icon\n• Enhanced Flasher Report Pagination\n• System Templates & Inventory Fixes\n• API Security Lockdowns',

  });
}


