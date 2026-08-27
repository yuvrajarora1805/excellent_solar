import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.2.0',
    version_code: 5,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Updated Branding Logo\n• Enhanced Flasher Report Pagination & Chunked Batch Stock Loading\n• System Templates & Inventory Fixes\n• Security Lockdowns on API Endpoints',

  });
}


