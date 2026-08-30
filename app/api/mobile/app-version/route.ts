import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.4',
    version_code: 13,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Fixed Quotation Location Auto-Sync\n• Added Google Maps QR Code to Quotations',
  });
}


