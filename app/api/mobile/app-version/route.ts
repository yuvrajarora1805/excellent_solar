import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.14',
    version_code: 47,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed barcode scanning and product matching for dispatch\n• Fixed stock synchronization on order dispatch\n• Fixed fallback product ID for scanned serials',
  });
}
