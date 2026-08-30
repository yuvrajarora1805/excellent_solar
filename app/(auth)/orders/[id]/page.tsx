'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, ArrowLeft, Printer, CheckCircle, User, MapPin, Calendar, Camera, Barcode, Download } from 'lucide-react';
import type { Order } from '@/lib/db-helpers/orders';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [editableItems, setEditableItems] = useState<any[]>([]);
  const [savingPrices, setSavingPrices] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setEditableItems(data.order.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (index: number, field: 'quantity' | 'unit_price', val: number) => {
    const updated = [...editableItems];
    const qty = field === 'quantity' ? val : updated[index].quantity;
    const price = field === 'unit_price' ? val : updated[index].unit_price;
    updated[index] = {
      ...updated[index],
      [field]: val,
      line_total: qty * price,
    };
    setEditableItems(updated);
  };

  const handleSavePrices = async () => {
    try {
      setSavingPrices(true);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: editableItems }),
      });
      if (res.ok) {
        alert('Order prices & quantities updated successfully!');
        setIsEditingPrices(false);
        fetchOrder();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update prices');
      }
    } catch (err) {
      alert('Error updating prices');
    } finally {
      setSavingPrices(false);
    }
  };

  const handleDispatch = async () => {
    if (!confirm('Dispatch this order now? This will mark all scanned panel serial numbers as DISPATCHED and sync inventory stock.')) return;

    try {
      setUpdating(true);
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DISPATCHED' }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Order dispatched!');
        fetchOrder();
      } else {
        alert(data.error || 'Dispatch failed');
      }
    } catch (err) {
      alert('Error dispatching order');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!order) return;
    
    let csv = "Order Number,Date,Customer Name,Status\n";
    csv += `"${order.order_number}","${new Date(order.created_at).toLocaleDateString()}","${order.customer_name}","${order.status}"\n\n`;
    
    csv += "Product Code,Product Name,Quantity,Unit Price,Line Total\n";
    order.items?.forEach(item => {
      csv += `"${item.product_code}","${item.product_name}",${item.quantity},${item.unit_price},${item.line_total}\n`;
    });
    
    csv += "\nDispatched Solar Panel Serial Numbers\n";
    order.serials?.forEach((s, idx) => {
      csv += `"${idx + 1}","${s.serial_number}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dispatch_Details_${order.order_number}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading order details...</div>;
  if (!order) return <div className="p-8 text-center text-red-500">Order not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none print:w-[210mm]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      {/* Header & Actions */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Button>
        <div className="flex gap-2">
          {!isEditingPrices ? (
            <Button onClick={() => setIsEditingPrices(true)} variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50 font-bold">
              ✏️ Edit Prices / Quantities
            </Button>
          ) : (
            <Button onClick={handleSavePrices} disabled={savingPrices} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              {savingPrices ? 'Saving Prices...' : '💾 Save Updated Prices'}
            </Button>
          )}
          {order.status !== 'DISPATCHED' && order.status !== 'DELIVERED' && (
            <Button onClick={handleDispatch} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              <Truck className="w-4 h-4 mr-2" />
              {updating ? 'Dispatching...' : 'Dispatch Order & Sync Stock'}
            </Button>
          )}
          <Button onClick={handleDownloadCSV} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 font-bold">
            <Download className="w-4 h-4 mr-2" /> Export to Excel
          </Button>
          <Button onClick={() => window.print()} className="bg-blue-600 text-white">
            <Printer className="w-4 h-4 mr-2" /> Print Delivery Challan / Gate Pass
          </Button>
        </div>
      </div>

      {/* Printable Delivery Challan & Order Document */}
      <div className="bg-white text-black p-6 border rounded-lg shadow-sm print:shadow-none print:border-none print:p-0 print-only">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo.png" alt="Excellent Solar" className="h-14 w-auto" />
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Kotkapura, Faridkot | Phone: +91 98581-09000, 77196-52727
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white text-xs font-extrabold px-3 py-1 uppercase rounded">
              {order.order_type === 'PROJECT' ? 'Customer Installation Order' : 'Retail OTC Delivery Challan'}
            </span>
            <h2 className="text-xl font-mono font-black text-blue-700 mt-1">{order.order_number}</h2>
            <p className="text-xs font-bold text-slate-600">Date: {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer & Vehicle Info Grid */}
        <div className="grid grid-cols-2 gap-4 border p-3 rounded mb-4 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase block mb-1">Customer Details</span>
            <p className="font-extrabold text-sm text-slate-900">{order.customer_name}</p>
            {order.customer_mobile && <p className="text-slate-600">Mobile: {order.customer_mobile}</p>}
            {order.delivery_address && <p className="text-slate-600 mt-1">Address: {order.delivery_address}</p>}
          </div>

          <div className="border-l pl-4">
            <span className="font-bold text-slate-500 uppercase block mb-1">Vehicle & Dispatch Proof</span>
            <p className="font-extrabold text-sm text-blue-800 font-mono">
              Vehicle #: {order.vehicle_number || 'N/A'}
            </p>
            {order.driver_name && <p className="text-slate-600">Driver: {order.driver_name} ({order.driver_mobile || 'N/A'})</p>}
            <p className="text-slate-600 mt-1">
              Status: <span className="font-bold uppercase text-emerald-700">{order.status}</span>
            </p>
            {order.vehicle_photo_path && (
              <div className="mt-2 border rounded p-1 bg-slate-50 inline-block max-w-[200px]">
                <span className="text-[9px] font-bold text-slate-500 block mb-1 uppercase">Captured Vehicle Delivery Photo:</span>
                <img
                  src={order.vehicle_photo_path}
                  alt="Vehicle Proof"
                  className="max-h-28 w-auto object-contain rounded border vehicle-proof-img"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-extrabold uppercase text-slate-700">Order Items & Pricing</h3>
            {isEditingPrices && (
              <span className="text-xs font-bold text-amber-600 animate-pulse">
                ✏️ Price Editing Mode Active - Update Unit Price / Quantity and click Save
              </span>
            )}
          </div>
          <table className="w-full text-xs border-collapse border border-black text-left">
            <thead>
              <tr className="bg-slate-100 border-b border-black font-bold">
                <th className="p-2 border border-black">#</th>
                <th className="p-2 border border-black">Product Code</th>
                <th className="p-2 border border-black">Product Name</th>
                <th className="p-2 border border-black text-right">Quantity</th>
                <th className="p-2 border border-black text-right">Unit Price (₹)</th>
                <th className="p-2 border border-black text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {!isEditingPrices
                ? order.items?.map((item, i) => (
                    <tr key={i} className="border-b border-black font-medium">
                      <td className="p-2 border border-black text-center">{i + 1}</td>
                      <td className="p-2 border border-black font-mono">{item.product_code}</td>
                      <td className="p-2 border border-black font-bold">{item.product_name}</td>
                      <td className="p-2 border border-black text-right font-bold">{item.quantity}</td>
                      <td className="p-2 border border-black text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                      <td className="p-2 border border-black text-right font-bold">₹{item.line_total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                : editableItems.map((item, i) => (
                    <tr key={i} className="border-b border-black font-medium bg-amber-50/50">
                      <td className="p-2 border border-black text-center">{i + 1}</td>
                      <td className="p-2 border border-black font-mono">{item.product_code}</td>
                      <td className="p-2 border border-black font-bold">{item.product_name}</td>
                      <td className="p-2 border border-black text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handlePriceChange(i, 'quantity', Number(e.target.value))}
                          className="w-16 p-1 border rounded text-right font-bold text-xs"
                        />
                      </td>
                      <td className="p-2 border border-black text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handlePriceChange(i, 'unit_price', Number(e.target.value))}
                          className="w-24 p-1 border rounded text-right font-bold text-xs"
                        />
                      </td>
                      <td className="p-2 border border-black text-right font-bold">
                        ₹{item.line_total?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-extrabold text-sm border-t border-black">
                <td colSpan={5} className="p-2 text-right border border-black">Total Order Amount:</td>
                <td className="p-2 text-right text-blue-800 border border-black">
                  ₹
                  {(!isEditingPrices
                    ? order.total_amount
                    : editableItems.reduce((acc, curr) => acc + (curr.line_total || 0), 0)
                  ).toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Dispatched Unique Barcode Serials */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-blue-600" />
              Dispatched Unique Solar Panel Barcode Serial Numbers ({order.serials?.length || 0})
            </h3>
          </div>

          <div className="border border-black p-3 rounded bg-slate-50 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono font-bold">
              {order.serials?.map((s, idx) => (
                <div key={idx} className="p-1.5 bg-white border rounded text-blue-900 flex items-center gap-1">
                  <span className="text-slate-400 text-[10px]">{idx + 1}.</span>
                  <span>{s.serial_number}</span>
                </div>
              ))}
            </div>
            {(!order.serials || order.serials.length === 0) && (
              <p className="text-slate-500 italic">No specific barcodes recorded for this order.</p>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-8 mt-8 border-t border-black text-xs font-bold text-center">
          <div>
            <p className="mb-8">Customer / Receiver Signature</p>
            <div className="border-t border-dashed border-slate-400 pt-1">
              {order.customer_name || 'Customer Signature'}
            </div>
          </div>
          <div>
            <p className="mb-8">Store Incharge Signature</p>
            <div className="border-t border-dashed border-slate-400 pt-1">
              Store Incharge
            </div>
          </div>
          <div>
            <p className="mb-8">Authorized Signatory</p>
            <div className="border-t border-dashed border-slate-400 pt-1">
              Excellent Solar Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
