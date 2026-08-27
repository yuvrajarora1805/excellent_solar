import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.2',
    version_code: 3,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Added 1D Barcode restricted camera scanning (QR codes ignored)\n• Added audio click sound and haptic vibration feedback on scan\n• Added real-time MySQL inventory stock matching\n• Added secure JWT authentication for APIs\n• Updated UI layout & customer dropdown selection',
  });
}

