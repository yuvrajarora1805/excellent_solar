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
  rate_per_watt: string;
  total_cost: string;
  gst_info?: string;
  installation_discom_fee?: string;
  bank_details?: string;
  terms?: string[];
}

const DEFAULT_MATERIALS: SolarQuotationItem[] = [
  { sr_no: 1, material: 'SOLAR PANELS', quantity: '325', brand: 'WAAREE TOPCON', description: '615 W' },
  { sr_no: 2, material: 'INVERTER', quantity: '2', brand: 'WAAREE/LUMINOUS', description: '8 YEARS WARRANTY' },
  { sr_no: 3, material: 'EARTHING', quantity: '5+1', brand: '3 METER', description: 'COPPER BONDED WITH CHEMICAL' },
  { sr_no: 4, material: 'LIGTNING ARRESTER', quantity: '2', brand: '1 METER', description: 'COPPER BONDED' },
  { sr_no: 5, material: 'STRUCTURE', quantity: '200 KW', brand: '70 MM HEIGHT', description: 'ALUMINIUM' },
  { sr_no: 6, material: 'EARTHING WIRE', quantity: 'AS PER REQUIRED', brand: 'HAVELLS', description: '4 MM & 6MM' },
  { sr_no: 7, material: 'SERVICE WIRE', quantity: '50 MTR MAXI.', brand: 'AS PER PSPCL', description: '150 MM ALUMINIUM' },
  { sr_no: 8, material: 'DC WIRE', quantity: 'AS PER REQUIRED', brand: 'WAAREE/HAVELLS', description: '6 MM' },
  { sr_no: 9, material: 'ACDB', quantity: '1', brand: 'HAVELLS', description: '' },
  { sr_no: 10, material: 'DCDB', quantity: 'N.A', brand: 'N.A', description: '' },
];

export const SolarQuotationTemplate: React.FC<{ data: Partial<SolarQuotationData> }> = ({ data }) => {
  const materials = data.materials && data.materials.length > 0 ? data.materials : DEFAULT_MATERIALS;
  const terms = data.terms && data.terms.length > 0 ? data.terms : [
    '1. Validity: This quotation is valid for 15 days from the date of issue.',
    '2. Payment Terms: 30% advance, 65% on delivery, 5% on completion',
    '3. Maintenance: 1 Year , Maintenance (without panel washing) included, Annual Maintenance Contract available after 1 year optional'
  ];

  return (
    <div className="bg-white text-black font-sans p-8 mx-auto border border-black shadow-lg w-[210mm] min-h-[297mm] box-border relative print:shadow-none print:border-none print:p-8 print:m-0 print:w-[210mm]">
      {/* Header Logo */}
      <div className="text-center mb-4 flex justify-center">
        <img src="/logo.png" alt="Excellent Solar Logo" className="h-16 object-contain" />
      </div>

      {/* Address Header Box */}
      <div className="border border-black text-[11px] font-semibold text-center py-1.5 px-2 mb-2 leading-tight">
        ADD.Vijay Nagar, Moga Road, Near Grain Market Gate 1, Kotkapura, Faridkot.
        <br />
        Phone: +91 98581-09000, 77196-52727, 76108-00035 Email:excellentsolarkkp@gmail.com
      </div>

      {/* Customer & Project Spec Box */}
      <table className="w-full border-collapse border border-black mb-2 text-xs">
        <tbody>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold w-[65%] border-r border-black">
              To <span className="uppercase text-sm ml-2 font-serif font-black">{data.customer_name || 'M.G PIPE INDUSTRIES'}</span>
            </td>
            <td className="p-1.5 font-bold text-right font-serif">
              DATE : {data.date || '10/08/2026'}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold border-r border-black">Project Type</td>
            <td className="p-1.5 font-bold text-center uppercase tracking-wide">{data.project_type || 'ONGRID SOLAR'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold border-r border-black text-[10px] uppercase leading-tight">
              PROPOSED<br />CAPACITY
            </td>
            <td className="p-1.5 font-extrabold text-center text-sm">{data.capacity || '200 KW'}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-bold border-r border-black">Location</td>
            <td className="p-1.5 font-bold text-center uppercase tracking-wider">{data.location || 'JALALABAD'}</td>
          </tr>
        </tbody>
      </table>

      {/* Material Detail Table */}
      <table className="w-full border-collapse border border-black mb-2 text-[11px]">
        <thead>
          <tr className="bg-[#6b9e38] text-black font-extrabold border-b border-black text-center">
            <th className="border border-black p-1.5 w-[8%]">Sr No.</th>
            <th className="border border-black p-1.5 text-center w-[35%]">MATERIAL DETAIL</th>
            <th className="border border-black p-1.5 w-[8%] leading-tight text-[10px]">
              QUANTI<br />TY
            </th>
            <th className="border border-black p-1.5 text-center w-[25%]">BRAND</th>
            <th className="border border-black p-1.5 text-center w-[24%]">Description</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, idx) => (
            <tr key={idx} className={`border-b border-black text-center font-bold ${idx % 2 === 0 ? 'bg-[#ffffe0]' : 'bg-white'}`}>
              <td className="border border-black p-1.5 font-normal">{m.sr_no || idx + 1}</td>
              <td className="border border-black p-1.5 text-left font-black italic uppercase">{m.material}</td>
              <td className="border border-black p-1.5 font-extrabold uppercase">{m.quantity}</td>
              <td className="border border-black p-1.5 uppercase font-extrabold">{m.brand}</td>
              <td className="border border-black p-1.5 uppercase text-center font-extrabold">{m.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Commercial Summary Box */}
      <table className="w-full border-collapse border border-black mb-2 text-xs bg-[#e64a19] text-white font-bold">
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 w-[50%]">Total Project Rate/Watt (INR)</td>
            <td className="border-r border-black p-1.5 text-center text-sm">{data.rate_per_watt || '23.50/-'}</td>
            <td className="p-1.5 text-center text-[10px] uppercase">{data.gst_info || 'GST EXTRA 8.9%'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5">Total Project Cost (INR)</td>
            <td className="border-r border-black p-1.5 text-center text-base font-black">{data.total_cost || '47,00,000/-'}</td>
            <td className="p-1.5 text-center text-[10px] uppercase">{data.gst_info || 'GST EXTRA (8.9%)'}</td>
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

      {/* Indicative Note */}
      <p className="text-center italic text-[11px] font-serif mb-1">
        Note: Prices are indicative and subject to final site inspection and design.
      </p>

      {/* Terms & Conditions Box */}
      <div className="border border-black mb-3 text-xs">
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
      <div className="text-center mt-4">
        <p className="italic text-xs font-serif mb-4 font-bold">
          For any clarifications or site survey scheduling, feel free to contact us.
        </p>
        <div className="inline-block text-center font-bold">
          <p className="text-xs">Authorized Signatory</p>
          <p className="text-sm font-black">Excellent Solar</p>
        </div>
      </div>
    </div>
  );
};
