import { NextRequest, NextResponse } from 'next/server';
import { quotationDb } from '@/lib/db-helpers/quotations';
import { query } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid quotation ID' }, { status: 400 });
    }

    const quotation = await quotationDb.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const qAny = quotation as any;
    // Fetch customer details
    const customers = await query<any>('SELECT * FROM customers WHERE id = ?', [qAny.customer_id || 1]);
    const customer = customers.length > 0 ? customers[0] : { name: qAny.customer_name || 'Customer' };

    const items = quotation.items || [];
    const dateFormatted = quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

    // Build printable HTML page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Solar Rooftop Quotation - ${quotation.quotation_number}</title>
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #000; margin: 0; padding: 15px; background: #fff; }
    .container { max-width: 800px; margin: 0 auto; border: 1px solid #000; padding: 20px; box-sizing: border-box; }
    .logo-header { text-align: center; margin-bottom: 10px; position: relative; }
    .logo-header img { height: 90px; object-fit: contain; }
    .qr-container { position: absolute; top: 0; right: 0; display: flex; flex-direction: column; align-items: center; }
    .qr-container img { width: 64px; height: 64px; border: 1px solid #ccc; box-shadow: 1px 1px 3px rgba(0,0,0,0.1); object-fit: cover; }
    .qr-container span { font-size: 8px; font-weight: bold; margin-top: 2px; }
    .address-box { border: 1px solid #000; font-size: 11px; font-weight: bold; text-align: center; padding: 6px; margin-bottom: 12px; line-height: 1.4; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
    table, th, td { border: 1px solid #000; }
    th, td { padding: 6px 8px; }
    .spec-table td { font-weight: bold; }
    .spec-label { width: 20%; }
    .spec-val { width: 30%; text-transform: uppercase; }
    .mat-header { bg-color: #6b9e38; background-color: #6b9e38; color: #000; font-weight: 900; text-align: center; }
    .row-even { background-color: #ffffe0; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .summary-box { background-color: #e64a19; color: #fff; font-weight: bold; font-size: 13px; margin-bottom: 12px; }
    .terms-box { border: 1px solid #000; padding: 10px; font-size: 11px; margin-top: 15px; }
    .terms-title { font-weight: bold; margin-bottom: 5px; }
    .sig-area { margin-top: 30px; display: flex; justify-content: flex-end; font-size: 12px; font-weight: bold; }
    @media print {
      body { padding: 0; }
      .container { border: none; padding: 0; }
      .no-print { display: none; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>

  <div class="no-print" style="margin-bottom: 15px; text-align: right;">
    <button onclick="window.print()" style="background: #16a34a; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 5px; cursor: pointer; font-size: 14px;">
      🖨️ Print / Save as PDF
    </button>
  </div>

  <div class="container">
    <div class="logo-header">
      <img src="/qutaionlogo.png" alt="Excellent Solar Logo" onerror="this.onerror=null; this.src='/logo.png';" />
      <div class="qr-container">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=\${encodeURIComponent((quotation.project_latitude && quotation.project_longitude) ? \`https://maps.google.com/?q=\${quotation.project_latitude},\${quotation.project_longitude}\` : (customer.latitude && customer.longitude) ? \`https://maps.google.com/?q=\${customer.latitude},\${customer.longitude}\` : \`https://maps.google.com/?q=\${quotation.remarks || customer.city || 'Punjab'}\`)}" alt="QR Code" />
        <span>Scan for Map</span>
      </div>

    </div>

    <div class="address-box">
      ADD. Vijay Nagar, Moga Road, Near Grain Market Gate 1, Kotkapura, Faridkot.<br />
      Phone: +91 98581-09000, 77196-52727, 76108-00035 | Email: excellentsolarkkp@gmail.com
    </div>

    <table class="spec-table">
      <tr>
        <td class="spec-label" style="width: 15%;">To</td>
        <td class="spec-val" style="width: 25%; font-weight: bold; text-transform: uppercase;">${customer.name || qAny.customer_name || 'GPS Quila Kotkapura'}</td>
        <td class="spec-label" style="width: 15%;">DATE :</td>
        <td class="spec-val" style="width: 45%; font-weight: bold;">${dateFormatted}</td>
      </tr>
      <tr>
        <td class="spec-label" style="width: 15%;">Project Type</td>
        <td class="spec-val" style="width: 25%; text-transform: uppercase;">${(quotation.system_type || 'ONGRID_SOLAR').replace(/_/g, ' ')}</td>
        <td class="spec-label" style="width: 15%;" rowspan="2">Location</td>
        <td class="spec-val" style="width: 45%; text-transform: uppercase; vertical-align: top;" rowspan="2">${quotation.remarks || customer.city || customer.address || 'JALALABAD'}</td>
      </tr>
      <tr>
        <td class="spec-label" style="width: 15%;">PROPOSED CAPACITY</td>
        <td class="spec-val" style="width: 25%; font-size: 14px; font-weight: 900;">${quotation.capacity_kw || '200'} KW</td>
      </tr>
    </table>

    <table>
      <thead>
        <tr class="mat-header">
          <th style="width: 8%;">Sr No.</th>
          <th style="width: 35%; text-align: center;">MATERIAL DETAIL</th>
          <th style="width: 17%; text-align: center;">QUANTITY</th>
          <th style="width: 20%; text-align: center;">BRAND</th>
          <th style="width: 20%; text-align: center;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${items.length > 0 ? items.map((it: any, idx: number) => `
          <tr class="${idx % 2 === 0 ? 'row-even' : ''}" style="font-weight: bold; text-align: center;">
            <td class="text-center" style="font-weight: normal;">${idx + 1}</td>
            <td style="text-transform: uppercase; text-align: left; font-weight: 900; font-style: italic;">${it.description || it.product_name || 'SOLAR ITEM'}</td>
            <td class="text-center" style="text-transform: uppercase; font-weight: 900;">${it.quantity}</td>
            <td class="text-center" style="text-transform: uppercase; font-weight: bold;">${it.brand || it.product_code || 'N.A'}</td>
            <td class="text-center" style="text-transform: uppercase; font-weight: bold;">${it.unit || it.remarks || ''}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="5" class="text-center">No material items specified</td>
          </tr>
        `}
      </tbody>
    </table>

    <table style="background-color: #d84315; color: #fff; font-weight: bold; font-size: 12px; margin-bottom: 10px;">
      <tr>
        <td style="width: 65%;">Total Project Rate/Watt (INR)</td>
        <td style="width: 20%; text-align: center; font-size: 14px; font-weight: 900;">${(quotation as any).rate_per_watt || '23.50'}/-</td>
        <td style="width: 15%; text-align: center; font-size: 10px; font-weight: 900;">${quotation.gst_percentage ? `GST EXTRA ${quotation.gst_percentage}%` : 'GST EXTRA 8.9%'}</td>
      </tr>
      <tr>
        <td>Total Project Cost (INR)</td>
        <td style="text-align: center; font-size: 14px; font-weight: 900;">${Number(quotation.total_amount || 4700000).toLocaleString('en-IN')}/-</td>
        <td style="text-align: center; font-size: 10px; font-weight: 900;">${quotation.gst_percentage ? `GST EXTRA (${quotation.gst_percentage}%)` : 'GST EXTRA (8.9%)'}</td>
      </tr>
      <tr>
        <td style="font-size: 10px;">INSTALLATION AND DISCOM FEE/APPROVAL</td>
        <td style="text-align: center; font-weight: 900;">INCLUDED</td>
        <td style="text-align: center; font-weight: 900;">INCLUDED</td>
      </tr>
      <tr>
        <td colSpan="3" style="text-align: center; background-color: #fff59d; color: #000; font-weight: 900; font-size: 11px; font-style: italic; padding: 6px;">
          BANK:- AXIS BANK KKP, NAME EXCELLENT SOLAR , A/C NO 922030040457208 , IFSC UTIB0000577
        </td>
      </tr>
    </table>

    <div class="terms-box" style="margin-top: 5px; margin-bottom: 20px;">
      <div class="terms-title" style="background-color: #6b9e38; color: #000; padding: 3px; text-align: center; font-weight: 900;">TERMS & CONDITIONS:</div>
      <div style="padding: 6px; font-size: 11px; font-weight: 600;">
        <div>1. Validity: This quotation is valid for 15 days from the date of issue.</div>
        <div>2. Payment Terms: 30% advance, 65% on delivery, 5% on completion</div>
        <div>3. Maintenance: 1 Year , Maintenance (without panel washing) included, Annual Maintenance Contract available after 1 year optional</div>
      </div>
    </div>

    <div class="sig-area">
      <div style="text-align: center;">
        <div style="font-size: 10px; color: #555; text-transform: uppercase; margin-bottom: 25px;">Authorized Signatory</div>
        <div style="font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 2px;">Excellent Solar</div>
      </div>
    </div>
  </div>

  <script>
    // Auto trigger print dialog if requested
    if (window.location.search.includes('print=true')) {
      window.onload = function() { window.print(); };
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error rendering quotation PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF view' }, { status: 500 });
  }
}
