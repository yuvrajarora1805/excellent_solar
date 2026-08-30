'use client';

import React from 'react';

export interface SolarQuotationItem {
  sr_no: number | string;
  material: string;
  quantity: string;
  brand: string;
  description: string;
}

export interface SolarQuotationData {
  customer_name: string;
  date: string;
  project_type: string;
  capacity: string;
  location: string;
  materials: SolarQuotationItem[];
  rate_per_watt?: string;
  total_cost: string;
  gst_info?: string;
  installation_discom_fee?: string;
  bank_details?: string;
  terms?: string[];
  created_by_name?: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_MATERIALS: SolarQuotationItem[] = [
  { sr_no: 1, material: 'SOLAR PANELS', quantity: '0', brand: 'WAAREE TOPCON', description: '615 W' },
  { sr_no: 2, material: 'INVERTER', quantity: '0', brand: 'WAAREE/LUMINOUS', description: '8 YEARS WARRANTY' },
  { sr_no: 3, material: 'EARTHING', quantity: '0', brand: '3 METER', description: 'COPPER BONDED WITH CHEMICAL' },
  { sr_no: 4, material: 'LIGTNING ARRESTER', quantity: '0', brand: '1 METER', description: 'COPPER BONDED' },
  { sr_no: 5, material: 'STRUCTURE', quantity: '0', brand: '70 MM HEIGHT', description: 'ALUMINIUM' },
  { sr_no: 6, material: 'EARTHING WIRE', quantity: '0', brand: 'HAVELLS', description: '4 MM & 6MM' },
  { sr_no: 7, material: 'SERVICE WIRE', quantity: '0', brand: 'AS PER PSPCL', description: '150 MM ALUMINIUM' },
  { sr_no: 8, material: 'DC WIRE', quantity: '0', brand: 'WAAREE/HAVELLS', description: '6 MM' },
  { sr_no: 9, material: 'ACDB', quantity: '0', brand: 'HAVELLS', description: '' },
  { sr_no: 10, material: 'DCDB', quantity: '0', brand: 'N.A', description: '' },
];

export const SolarQuotationTemplate: React.FC<{ data: Partial<SolarQuotationData> }> = ({ data }) => {
  const materials = data.materials && data.materials.length > 0 ? data.materials : DEFAULT_MATERIALS;
  const terms = data.terms && data.terms.length > 0 ? data.terms : [
    '1. Validity: This quotation is valid for 15 days from the date of issue.',
    '2. Payment Terms: 30% advance, 65% on delivery, 5% on completion',
    '3. Maintenance: 1 Year , Maintenance (without panel washing) included, Annual Maintenance Contract available after 1 year optional'
  ];

  return (
    <div className="bg-white text-black font-sans p-6 mx-auto border border-black shadow-lg w-full max-w-[210mm] min-h-[297mm] box-border relative print:shadow-none print:border-none print:p-6 print:m-0 print:w-[210mm]">
      {/* Header Logo */}
      <div className="text-center mb-3 flex justify-center relative">
        <img src="/qutaionlogo.png" alt="Excellent Solar Logo" className="h-24 object-contain mx-auto" />
        
        {/* QR Code */}
          <div className="absolute top-0 right-0 flex flex-col items-center">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=4&qzone=1&data=${encodeURIComponent(data.latitude && data.longitude ? `https://maps.google.com/?q=${data.latitude},${data.longitude}` : `https://maps.google.com/?q=${encodeURIComponent(data.location || 'Punjab')}`)}`} 
              alt="Location QR" 
              width={75}
              height={75}
              style={{ imageRendering: 'crisp-edges', width: '75px', height: '75px', border: '1px solid #d1d5db' }} 
            />
            <span className="text-[8px] mt-0.5 font-bold">Scan for Map</span>
          </div>
      </div>

      {/* Address Header Box */}
      <div className="border border-black text-[11px] font-semibold text-center py-1 px-2 mb-2 leading-tight">
        ADD. Vijay Nagar, Moga Road, Near Grain Market Gate 1, Kotkapura, Faridkot.
        <br />
        Phone: +91 98581-09000, 77196-52727, 76108-00035 Email: excellentsolarkkp@gmail.com
      </div>

      {/* Customer & Project Spec Box */}
      <table className="w-full border-collapse border border-black mb-2 text-xs">
        <tbody>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold border-r border-black w-[15%]">To</td>
            <td className="p-1.5 font-bold border-r border-black w-[25%] uppercase">{data.customer_name || 'GPS Quila Kotkapura'}</td>
            <td className="p-1.5 font-bold border-r border-black w-[15%]">DATE :</td>
            <td className="p-1.5 font-bold w-[45%]">{data.date || '30/8/2026'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold border-r border-black w-[15%]">Project Type</td>
            <td className="p-1.5 font-bold border-r border-black w-[25%] uppercase">{data.project_type || 'ONGRID SOLAR'}</td>
            <td className="p-1.5 font-bold border-r border-black w-[15%]" rowSpan={2}>Location</td>
            <td className="p-1.5 font-bold uppercase w-[45%] align-top" rowSpan={2}>{data.location || 'JALALABAD'}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-bold border-r border-black text-[10px] leading-tight w-[15%]">PROPOSED<br />CAPACITY</td>
            <td className="p-1.5 font-extrabold border-r border-black text-sm uppercase w-[25%]">{data.capacity || '200 KW'}</td>
          </tr>
        </tbody>
      </table>

      {/* Material Detail Table (Exact 5 Columns matching user image) */}
      <table className="w-full border-collapse border border-black mb-2 text-[11px]">
        <thead>
          <tr className="bg-[#6b9e38] text-black font-extrabold border-b border-black text-center">
            <th className="border border-black p-1.5 w-[8%]">Sr No.</th>
            <th className="border border-black p-1.5 text-center w-[35%]">MATERIAL DETAIL</th>
            <th className="border border-black p-1.5 text-center w-[17%] leading-tight">
              QUANTI<br />TY
            </th>
            <th className="border border-black p-1.5 text-center w-[20%]">BRAND</th>
            <th className="border border-black p-1.5 text-center w-[20%]">Description</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m: any, idx: number) => (
            <tr key={idx} className={`border-b border-black text-center font-bold ${idx % 2 === 0 ? 'bg-[#ffffe0]' : 'bg-white'}`}>
              <td className="border border-black p-1.5 font-normal">{m.sr_no || idx + 1}</td>
              <td className="border border-black p-1.5 text-left font-black italic uppercase">{m.material}</td>
              <td className="border border-black p-1.5 font-black uppercase text-center">{m.quantity}</td>
              <td className="border border-black p-1.5 font-extrabold uppercase text-center">{m.brand || 'N.A'}</td>
              <td className="border border-black p-1.5 font-extrabold uppercase text-center">{m.description || 'N.A'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Commercial Summary Box (Orange/Coral matching user image) */}
      <table className="w-full border-collapse border border-black mb-2 text-xs bg-[#d84315] text-white font-bold">
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 w-[65%]">Total Project Rate/Watt (INR)</td>
            <td className="border-r border-black p-1.5 text-center w-[20%] text-sm font-black">{data.rate_per_watt || '23.50'}/-</td>
            <td className="p-1.5 text-center w-[15%] text-[10px] uppercase font-black">{data.gst_info || 'GST EXTRA 8.9%'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5">Total Project Cost (INR)</td>
            <td className="border-r border-black p-1.5 text-center text-sm font-black">{data.total_cost || '47,00,000'}/-</td>
            <td className="p-1.5 text-center text-[10px] uppercase font-black">{data.gst_info || 'GST EXTRA (8.9%)'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 text-[10px] uppercase">INSTALLATION AND DISCOM FEE/APPROVAL</td>
            <td className="border-r border-black p-1.5 text-center font-black">INCLUDED</td>
            <td className="p-1.5 text-center font-black">INCLUDED</td>
          </tr>
          <tr>
            <td colSpan={3} className="p-1.5 text-center bg-[#fff59d] text-black font-black border-t border-black text-[11px] italic">
              {data.bank_details || 'BANK:- AXIS BANK KKP, NAME EXCELLENT SOLAR , A/C NO 922030040457208 , IFSC UTIB0000577'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terms & Conditions Box */}
      <div className="border border-black mb-4 text-xs">
        <div className="bg-[#6b9e38] text-black font-extrabold text-center py-0.5 border-b border-black">
          Terms & Conditions:
        </div>
        <div className="p-1.5 text-[11px] font-semibold space-y-0.5">
          {terms.map((term, i) => (
            <div key={i}>{term}</div>
          ))}
        </div>
      </div>

      {/* Signature & Stamp Section */}
      <div className="flex justify-end items-end pt-2 border-t border-slate-200">
        <div className="text-center font-bold">
          <p className="text-xs mb-8">Authorized Signatory</p>
          <p className="text-sm font-black border-t border-dashed border-black pt-1">Excellent Solar</p>
        </div>
      </div>
    </div>
  );
};
