'use client';

import React, { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Store, Download, Package, Truck, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface OrderItem {
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: number;
  order_number: string;
  order_type: 'PROJECT' | 'RETAIL';
  customer_id: number;
  customer_name: string;
  customer_mobile?: string;
  delivery_address?: string;
  total_amount: number;
  status: string;
  created_at: string;
  dispatched_at?: string;
  items?: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_DISPATCH:    { label: 'Pending Dispatch',     color: 'bg-amber-100 text-amber-800 border-amber-300',   icon: <Clock className="w-3 h-3" /> },
  READY_FOR_DISPATCH:  { label: 'Ready for Dispatch',   color: 'bg-blue-100 text-blue-800 border-blue-300',      icon: <Package className="w-3 h-3" /> },
  DISPATCHED:          { label: 'Dispatched',            color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <Truck className="w-3 h-3" /> },
  DELIVERED:           { label: 'Delivered',             color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELLED:           { label: 'Cancelled',             color: 'bg-red-100 text-red-800 border-red-300',         icon: <XCircle className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-slate-100 text-slate-700 border-slate-300', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function RetailOrdersDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ order_type: 'RETAIL', limit: '100' });
      if (search) params.set('search', search);

      const res = await fetch(`/api/orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch retail orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (orderId: number) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: data.order?.items || [] } : o));
      }
    } catch (e) {
      console.error(e);
    }
    setExpandedId(orderId);
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Dealer Name', 'Mobile', 'Address', 'Status', 'Total Amount', 'Date'];
    const rows = orders.map(o => [
      o.order_number,
      `"${o.customer_name}"`,
      `"${o.customer_mobile || ''}"`,
      `"${o.delivery_address || ''}"`,
      o.status,
      o.total_amount,
      new Date(o.created_at).toLocaleDateString('en-IN'),
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = `retail_orders_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary counts
  const pending   = orders.filter(o => o.status === 'PENDING_DISPATCH' || o.status === 'READY_FOR_DISPATCH').length;
  const dispatched = orders.filter(o => o.status === 'DISPATCHED').length;
  const delivered  = orders.filter(o => o.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-8 h-8 text-emerald-600" />
            Retail Dealer Orders
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage retail dealer requirements — items are reserved until dispatched.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2 font-bold px-5 py-6">
            <Download className="w-5 h-5" /> Export CSV
          </Button>
          <Link href="/orders/retail/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-5 py-6">
              <Plus className="w-5 h-5" /> New Retail Requirement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending / Ready', value: pending,    color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
          { label: 'Dispatched',      value: dispatched, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
          { label: 'Delivered',       value: delivered,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center bg-white dark:bg-slate-900 p-3 rounded-lg border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search dealer name, mobile, order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b text-slate-700 dark:text-slate-300 font-bold uppercase">
              <tr>
                <th className="p-3">Order #</th>
                <th className="p-3">Dealer</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Reserved Items</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 animate-pulse">Loading retail orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Store className="w-10 h-10" />
                      <div className="font-semibold text-sm">No retail requirements found.</div>
                      <Link href="/orders/retail/new">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                          <Plus className="w-4 h-4" /> Add First Requirement
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : orders.map((o) => (
                <Fragment key={o.id}>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-mono font-bold text-blue-700 dark:text-blue-400">{o.order_number}</div>
                      <div className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{o.customer_name}</div>
                      {o.customer_mobile && <div className="text-[11px] text-slate-500">{o.customer_mobile}</div>}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                      {o.delivery_address || <span className="italic text-slate-400">No address</span>}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      ₹{Number(o.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={o.status} />
                      {o.dispatched_at && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          Dispatched: {new Date(o.dispatched_at).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => loadItems(o.id)}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        {expandedId === o.id ? 'Hide Items ▲' : 'View Items ▼'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <Link href={`/orders/${o.id}`}>
                        <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                          {['PENDING_DISPATCH','READY_FOR_DISPATCH'].includes(o.status) ? 'Dispatch →' : 'View Details'}
                        </Button>
                      </Link>
                    </td>
                  </tr>

                  {/* Expanded reserved items row */}
                  {expandedId === o.id && (
                    <tr key={`items-${o.id}`} className="bg-slate-50 dark:bg-slate-900/50">
                      <td colSpan={7} className="px-6 pb-4 pt-2">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" /> Reserved Stock Items
                        </div>
                        {!o.items || o.items.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No items found.</div>
                        ) : (
                          <table className="w-full text-xs border rounded-lg overflow-hidden">
                            <thead className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              <tr>
                                <th className="p-2 text-left">Product</th>
                                <th className="p-2 text-center">Qty Reserved</th>
                                <th className="p-2 text-right">Unit Price</th>
                                <th className="p-2 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {o.items.map((item, idx) => (
                                <tr key={idx} className="bg-white dark:bg-slate-800">
                                  <td className="p-2">
                                    <div className="font-semibold">{item.product_name}</div>
                                    <div className="text-slate-400 text-[10px]">{item.product_code}</div>
                                  </td>
                                  <td className="p-2 text-center font-bold text-amber-700">{item.quantity}</td>
                                  <td className="p-2 text-right">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                                  <td className="p-2 text-right font-bold">₹{Number(item.line_total).toLocaleString('en-IN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
