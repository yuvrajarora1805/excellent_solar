'use client';

import React from 'react';

export interface SolarQuotationItem {
  sr_no: number | string;
  material: string;
  quantity: string;
  unit_price?: string;
  line_total?: string;
}

export interface SolarQuotationData {
  customer_name: string;
  date: string;
  project_type: string;
  capacity: string;
  location: string;
  materials: SolarQuotationItem[];
  subtotal?: string;
  discount_amount?: string;
  gst_amount?: string;
  rate_per_watt?: string;
  total_cost: string;
  gst_info?: string;
  installation_discom_fee?: string;
  bank_details?: string;
  terms?: string[];
}

const DEFAULT_MATERIALS: SolarQuotationItem[] = [
  { sr_no: 1, material: 'SOLAR PANELS (615 W WAAREE TOPCON)', quantity: '325', unit_price: '-', line_total: '-' },
  { sr_no: 2, material: 'INVERTER (WAAREE/LUMINOUS)', quantity: '2', unit_price: '-', line_total: '-' },
  { sr_no: 3, material: 'EARTHING (3 METER COPPER BONDED)', quantity: '5+1', unit_price: '-', line_total: '-' },
  { sr_no: 4, material: 'LIGTNING ARRESTER (1 METER)', quantity: '2', unit_price: '-', line_total: '-' },
  { sr_no: 5, material: 'STRUCTURE (70 MM HEIGHT ALUMINIUM)', quantity: '200 KW', unit_price: '-', line_total: '-' },
  { sr_no: 6, material: 'EARTHING WIRE (HAVELLS 4/6MM)', quantity: 'AS PER REQUIRED', unit_price: '-', line_total: '-' },
  { sr_no: 7, material: 'SERVICE WIRE (150 MM ALUMINIUM)', quantity: '50 MTR MAXI.', unit_price: '-', line_total: '-' },
  { sr_no: 8, material: 'DC WIRE (6 MM WAAREE/HAVELLS)', quantity: 'AS PER REQUIRED', unit_price: '-', line_total: '-' },
  { sr_no: 9, material: 'ACDB (HAVELLS)', quantity: '1', unit_price: '-', line_total: '-' },
  { sr_no: 10, material: 'DCDB', quantity: 'N.A', unit_price: '-', line_total: '-' },
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
        <img src="/qutaionlogo.png" alt="Excellent Solar Logo" className="h-28 object-contain" />
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
            <td className="p-1.5 font-bold border-r border-black w-[20%]">Customer Name</td>
            <td className="p-1.5 font-bold border-r border-black w-[30%] uppercase">{data.customer_name || 'M.G PIPE INDUSTRIES'}</td>
            <td className="p-1.5 font-bold border-r border-black w-[20%]">Date</td>
            <td className="p-1.5 font-bold w-[30%]">{data.date || '10/08/2026'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="p-1.5 font-bold border-r border-black w-[20%]">Project Type</td>
            <td className="p-1.5 font-bold border-r border-black w-[30%] uppercase">{data.project_type || 'ONGRID SOLAR'}</td>
            <td className="p-1.5 font-bold border-r border-black w-[20%] align-middle" rowSpan={2}>Location</td>
            <td className="p-1.5 font-bold w-[30%] uppercase align-middle" rowSpan={2}>{data.location || 'JALALABAD'}</td>
          </tr>
          <tr>
            <td className="p-1.5 font-bold border-r border-black w-[20%] text-[10px] leading-tight">PROPOSED<br />CAPACITY</td>
            <td className="p-1.5 font-extrabold border-r border-black w-[30%] text-sm">{data.capacity || '200 KW'}</td>
          </tr>
        </tbody>
      </table>

      {/* Material Detail Table */}
      <table className="w-full border-collapse border border-black mb-2 text-[11px]">
        <thead>
          <tr className="bg-[#6b9e38] text-black font-extrabold border-b border-black text-center">
            <th className="border border-black p-1.5 w-[8%]">Sr No.</th>
            <th className="border border-black p-1.5 text-center w-[45%]">MATERIAL DETAIL</th>
            <th className="border border-black p-1.5 text-center w-[15%]">UNIT PRICE (₹)</th>
            <th className="border border-black p-1.5 w-[12%] leading-tight text-[10px]">
              QUANTI<br />TY
            </th>
            <th className="border border-black p-1.5 text-center w-[20%]">TOTAL (₹)</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m: any, idx: number) => (
            <tr key={idx} className={`border-b border-black text-center font-bold ${idx % 2 === 0 ? 'bg-[#ffffe0]' : 'bg-white'}`}>
              <td className="border border-black p-1.5 font-normal">{m.sr_no || idx + 1}</td>
              <td className="border border-black p-1.5 text-left font-black italic uppercase">{m.material}</td>
              <td className="border border-black p-1.5 uppercase font-extrabold">{m.unit_price}</td>
              <td className="border border-black p-1.5 font-extrabold uppercase">{m.quantity}</td>
              <td className="border border-black p-1.5 uppercase text-center font-extrabold">{m.line_total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Commercial Summary Box */}
      <table className="w-full border-collapse border border-black mb-2 text-xs bg-[#e64a19] text-white font-bold">
        <tbody>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 w-[75%] text-right pr-4">Subtotal (INR)</td>
            <td className="p-1.5 text-center text-sm">{data.subtotal || '0'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 text-right pr-4">Discount (INR)</td>
            <td className="p-1.5 text-center text-sm">{data.discount_amount || '0'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 text-right pr-4">{data.gst_info || 'GST (18%)'}</td>
            <td className="p-1.5 text-center text-sm">{data.gst_amount || '0'}</td>
          </tr>
          <tr className="border-b border-black">
            <td className="border-r border-black p-1.5 text-right pr-4">Total Project Cost (INR)</td>
            <td className="p-1.5 text-center text-base font-black">{data.total_cost || '0'}</td>
          </tr>
          <tr>
            <td colSpan={2} className="p-1.5 text-center bg-[#fff59d] text-black font-black border-t border-black text-[11px] italic">
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
