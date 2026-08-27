import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.0.1',
    version_code: 2,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Added ticket detail view & approval workflow\n• Improved image compression & faster uploads\n• Added Tabbed Job Sections (Survey vs Installation)',
  });
}
