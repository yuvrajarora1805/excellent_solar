import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    latest_version: '1.1.0',
    version_code: 4,
    force_update: false,
    apk_url: 'https://es.omvky.com/downloads/field_app.apk',
    release_notes: '• Real-Time MySQL Stock Inventory Barcode Match\n• 1D Linear Barcode restriction (QR codes ignored)\n• 1-second auto-remove for unmatched camera barcodes\n• Real-time stock validation for manually typed serial numbers\n• Native PDF OCR parsing engine integration',
  });
}


