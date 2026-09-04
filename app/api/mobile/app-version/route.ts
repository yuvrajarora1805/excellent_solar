import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.9.0',
    version_code: 21,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Inventory Manager role\n• Added QR Code Scanning for stock addition',
  });
}
