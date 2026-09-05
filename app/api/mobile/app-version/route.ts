import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.11.6',
    version_code: 29,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Tap on any order card in the dispatch dashboard to view full order and delivery details\n• Scanning items now displays the exact product name on-screen, fixing generic fallback labels\n• Added support for submitting and viewing vehicle photo proof on delivery',
  });
}
