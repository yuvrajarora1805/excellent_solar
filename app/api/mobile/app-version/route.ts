import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.7.5',
    version_code: 14,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Redesigned Quotation Screen — matches web app layout\n• Inventory search dropdown per material row\n• Dark premium UI with Google Fonts\n• Rate/Watt auto-calculator\n• QR code fixes — opens Google Maps directly',
  });
}


