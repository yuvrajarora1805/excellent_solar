import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.12.17',
    version_code: 50,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/excellent-solar-app.apk',
    release_notes: '• Added Ready for Dispatch filter alongside Customer Project & Retail Sale\n• Added duplicate dispatch conflict prevention across drafts and completed orders\n• Fixed stock synchronization & serial numbers tracking',
  });
}
