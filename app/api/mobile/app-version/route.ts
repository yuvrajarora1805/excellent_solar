import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.18',
    version_code: 51,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Fixed submission button text visibility and contrast across all screens\n• Fixed customer booking draft and submission validation with live error messaging\n• Fixed stock dispatching and inventory synchronization',
  });
}
