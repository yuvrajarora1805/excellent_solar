import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.5',
    version_code: 28,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Dispatch multiple non-serialized items (like cables) alongside solar panels in a single order\n• Improved backend sync for mixing serialized and non-serialized products\n• Scan items now validate instantly and move errors to top',
  });
}
