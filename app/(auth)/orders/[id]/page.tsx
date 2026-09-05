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
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0 print:m-0 print:max-w-none print:w-[210mm]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
        }
      `}} />
      
      {/* Dashboard View (Hidden on Print) */}
      <div className="print-hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Order {order.order_number}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  order.status === 'DISPATCHED' || order.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.status}
                </span>
              </h1>
              <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditingPrices ? (
              <Button onClick={() => setIsEditingPrices(true)} variant="outline" className="border-amber-500 text-amber-700 hover:bg-amber-50 font-bold">
                ✏️ Edit Prices
              </Button>
            ) : (
              <Button onClick={handleSavePrices} disabled={savingPrices} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {savingPrices ? 'Saving...' : '💾 Save Prices'}
              </Button>
            )}
            {order.status !== 'DISPATCHED' && order.status !== 'DELIVERED' && (
              <Button onClick={handleDispatch} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                <Truck className="w-4 h-4 mr-2" />
                Dispatch & Sync
              </Button>
            )}
            <Button onClick={handleDownloadCSV} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50 font-bold">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button onClick={() => window.print()} className="bg-blue-600 text-white">
              <Printer className="w-4 h-4 mr-2" /> Print Challan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" /> Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-bold text-lg">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Mobile</p>
                    <p className="font-semibold">{order.customer_mobile || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500">Delivery Address</p>
                    <p className="font-semibold">{order.delivery_address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Barcode className="w-5 h-5" /> Order Items & Pricing
                </CardTitle>
                <div className="text-lg font-bold text-blue-700">
                  Total: ₹{(!isEditingPrices
                      ? order.total_amount
                      : editableItems.reduce((acc, curr) => acc + (curr.line_total || 0), 0)
                    ).toLocaleString('en-IN')}
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {!isEditingPrices
                      ? order.items?.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3">
                              <p className="font-bold">{item.product_name}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.product_code}</p>
                            </td>
                            <td className="p-3 text-right font-bold">{item.quantity}</td>
                            <td className="p-3 text-right text-slate-600">₹{item.unit_price.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-bold text-emerald-700">₹{item.line_total.toLocaleString('en-IN')}</td>
                          </tr>
                        ))
                      : editableItems.map((item, i) => (
                          <tr key={i} className="bg-amber-50">
                            <td className="p-3">
                              <p className="font-bold">{item.product_name}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.product_code}</p>
                            </td>
                            <td className="p-3 text-right">
                              <input type="number" min="1" value={item.quantity} onChange={(e) => handlePriceChange(i, 'quantity', Number(e.target.value))} className="w-20 p-2 border rounded text-right font-bold" />
                            </td>
                            <td className="p-3 text-right">
                              <input type="number" min="0" value={item.unit_price} onChange={(e) => handlePriceChange(i, 'unit_price', Number(e.target.value))} className="w-24 p-2 border rounded text-right font-bold" />
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-700">₹{item.line_total?.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {order.serials && order.serials.length > 0 && (
              <Card>
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Barcode className="w-5 h-5" /> Dispatched Serials ({order.serials.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {order.serials.map((s, idx) => (
                      <div key={idx} className="bg-slate-100 border px-3 py-1.5 rounded text-sm font-mono font-semibold flex items-center gap-2 text-slate-800">
                        <span className="text-xs text-slate-400">{idx + 1}.</span> {s.serial_number}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Dispatch & Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-500">Vehicle Number</p>
                  <p className="font-bold text-lg font-mono text-blue-700">{order.vehicle_number || 'Not Assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Driver</p>
                  <p className="font-semibold">{order.driver_name || 'N/A'} {order.driver_mobile ? `(${order.driver_mobile})` : ''}</p>
                </div>
                {order.vehicle_photo_path && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Camera className="w-4 h-4" /> Vehicle Proof Photo
                    </p>
                    <a href={order.vehicle_photo_path} target="_blank" rel="noreferrer" className="block w-full overflow-hidden rounded-lg border-2 border-slate-200 hover:border-blue-500 transition-colors">
                      <img src={order.vehicle_photo_path} alt="Vehicle Proof" className="w-full h-auto object-cover" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Printable Delivery Challan (Hidden on Screen, Visible on Print) */}
      <div className="hidden print:block bg-white text-black print:p-0 print:m-0 print:w-full print-only">
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
              {order.items?.map((item, i) => (
                <tr key={i} className="border-b border-black font-medium">
                  <td className="p-2 border border-black text-center">{i + 1}</td>
                  <td className="p-2 border border-black font-mono">{item.product_code}</td>
                  <td className="p-2 border border-black font-bold">{item.product_name}</td>
                  <td className="p-2 border border-black text-right font-bold">{item.quantity}</td>
                  <td className="p-2 border border-black text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                  <td className="p-2 border border-black text-right font-bold">₹{item.line_total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-extrabold text-sm border-t border-black">
                <td colSpan={5} className="p-2 text-right border border-black">Total Order Amount:</td>
                <td className="p-2 text-right text-blue-800 border border-black">
                  ₹{order.total_amount.toLocaleString('en-IN')}
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
              Dispatched Unique Barcode Serial Numbers ({order.serials?.length || 0})
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
        <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-black text-xs font-bold text-center">
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
