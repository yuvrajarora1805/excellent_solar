import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.0',
    version_code: 9,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Added 2D Barcode & QR Code Scanning Support (Data Matrix, QR Code, PDF417)\n• Intelligent Serial Number Payload Extraction\n• Enhanced Dispatch & Stock Synchronization',
  });
}


