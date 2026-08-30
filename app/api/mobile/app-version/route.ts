import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.7',
    version_code: 16,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Smart Autocomplete Customer Search\n• Material Selection via Popup Card Dialog\n• Clean Card View for Material details (no more tables!)\n• Automated update logic fixed permanently',
  });
}
