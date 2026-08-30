'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Truck, ShoppingBag, UserCheck, CheckCircle2, Clock, Camera, Eye, X } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  order_type: 'PROJECT' | 'RETAIL';
  customer_name: string;
  customer_mobile?: string;
  vehicle_number?: string;
  driver_name?: string;
  vehicle_photo_path?: string;
  total_amount: number;
  status: string;
  created_at: string;
  dispatched_at?: string;
}

export default function OrdersDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderTypeTab, setOrderTypeTab] = useState<'ALL' | 'PROJECT' | 'RETAIL'>('ALL');
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [orderTypeTab, search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (orderTypeTab !== 'ALL') params.set('order_type', orderTypeTab);
      if (search) params.set('search', search);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const projectCount = orders.filter(o => o.order_type === 'PROJECT').length;
  const retailCount = orders.filter(o => o.order_type === 'RETAIL').length;
  const dispatchedCount = orders.filter(o => o.status === 'DISPATCHED' || o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-8 h-8 text-blue-600" />
            Orders & Vehicle Dispatch Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage Customer Project Orders, Retail OTC Sales, Solar Panel Barcode Serials & Vehicle Delivery Proofs
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-5 py-6">
            <Plus className="w-5 h-5" />
            New Order / Dispatch (Scan Barcodes)
          </Button>
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center justify-between">
              Total Orders
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{orders.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              Project: <span className="font-bold text-blue-600">{projectCount}</span> | Retail OTC: <span className="font-bold text-emerald-600">{retailCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-between">
              Dispatched & Synced Stock
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{dispatchedCount}</div>
            <div className="text-xs text-slate-500 mt-1">Panels deducted & assigned to vehicles</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
              Ready for Dispatch
              <Clock className="w-4 h-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700 dark:text-amber-400">
              {orders.filter(o => o.status === 'READY_FOR_DISPATCH' || o.status === 'DRAFT').length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Pending vehicle loading</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border">
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setOrderTypeTab('ALL')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              orderTypeTab === 'ALL' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setOrderTypeTab('PROJECT')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              orderTypeTab === 'PROJECT' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Customer Project Orders ({projectCount})
          </button>
          <button
            onClick={() => setOrderTypeTab('RETAIL')}
            className={`px-4 py-2 text-xs font-bold rounded-md transition-colors ${
              orderTypeTab === 'RETAIL' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Retail OTC Sales ({retailCount})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search Order #, Customer, Vehicle #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b text-slate-700 dark:text-slate-300 font-bold uppercase">
              <tr>
                <th className="p-3">Order Number</th>
                <th className="p-3">Type</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Vehicle Details</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 animate-pulse">
                    Loading orders & vehicle dispatches...
                  </td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                    {o.order_number}
                    <div className="text-[10px] text-slate-400 font-normal">{new Date(o.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      o.order_type === 'PROJECT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {o.order_type === 'PROJECT' ? 'CUSTOMER PROJECT' : 'RETAIL SALE'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {o.customer_name}
                    {o.customer_mobile && <div className="text-[11px] text-slate-500 font-normal">{o.customer_mobile}</div>}
                  </td>
                  <td className="p-3">
                    {o.vehicle_number ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-bold">{o.vehicle_number}</span>
                          {o.driver_name && <span className="text-[10px] text-slate-500">({o.driver_name})</span>}
                        </div>
                        {o.vehicle_photo_path && (
                          <button
                            onClick={() => setPreviewPhoto({ url: o.vehicle_photo_path!, title: `Vehicle Proof - Order ${o.order_number} (${o.vehicle_number})` })}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline w-fit"
                          >
                            <Camera className="w-3.5 h-3.5" /> View Delivery Photo
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">No vehicle assigned</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    ₹{o.total_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      o.status === 'DISPATCHED' || o.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    {o.vehicle_photo_path && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 gap-1 font-bold"
                        onClick={() => setPreviewPhoto({ url: o.vehicle_photo_path!, title: `Vehicle Delivery Proof - ${o.order_number}` })}
                      >
                        <Eye className="w-3.5 h-3.5" /> Photo
                      </Button>
                    )}
                    <Link href={`/orders/${o.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                        Details & Serials
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No orders found. Create a new order to scan panel serials & assign vehicle delivery proof.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Lightbox Vehicle Photo Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-4 py-3 text-white border-b border-slate-800">
              <span className="font-bold text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                {previewPhoto.title}
              </span>
              <button onClick={() => setPreviewPhoto(null)} className="p-1 hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto bg-slate-950">
              <img
                src={previewPhoto.url}
                alt="Vehicle Delivery Proof"
                className="max-h-[75vh] w-auto object-contain rounded border border-slate-800"
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', '/logo.png');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
