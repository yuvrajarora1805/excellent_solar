import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.16',
    version_code: 49,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Yes/No confirmation dialog when clicking Clear All on scanned items\n• Fixed order dispatch & real-time stock sync\n• Fixed draft saving with scanned barcodes',
  });
}
