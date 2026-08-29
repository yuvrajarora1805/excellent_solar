import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.1',
    version_code: 10,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Fixed Orders menu visibility for Installation Workers\n• Added 2D Barcode & QR Code Scanning Support',
  });
}


