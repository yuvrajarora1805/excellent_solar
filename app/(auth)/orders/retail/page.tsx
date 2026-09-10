'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Store, Download } from 'lucide-react';

interface Order {
  id: number;
  order_number: string;
  order_type: 'PROJECT' | 'RETAIL';
  customer_name: string;
  customer_mobile?: string;
  delivery_address?: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function RetailOrdersDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('order_type', 'RETAIL');
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

  const exportToCSV = () => {
    const headers = ['Order Number', 'Dealer Name', 'Mobile', 'Address', 'Status', 'Total Amount', 'Date'];
    const rows = orders.map(o => [
      o.order_number,
      `"${o.customer_name}"`,
      `"${o.customer_mobile || ''}"`,
      `"${o.delivery_address || ''}"`,
      o.status,
      o.total_amount,
      new Date(o.created_at).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `retail_orders_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Store className="w-8 h-8 text-emerald-600" />
            Retail Orders (Office Section)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            View and manage retail dealer requirements and tickets.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline" className="gap-2 font-bold px-5 py-6">
            <Download className="w-5 h-5" /> Export CSV
          </Button>
          <Link href="/orders/retail/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold px-5 py-6">
              <Plus className="w-5 h-5" /> Add Retail Requirement
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-lg border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search Dealer Name, Mobile, Order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b text-slate-700 dark:text-slate-300 font-bold uppercase">
              <tr>
                <th className="p-3">Ticket / Order #</th>
                <th className="p-3">Dealer Details</th>
                <th className="p-3">Address</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 animate-pulse">
                    Loading retail orders...
                  </td>
                </tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                    {o.order_number}
                    <div className="text-[10px] text-slate-400 font-normal">{new Date(o.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {o.customer_name}
                    {o.customer_mobile && <div className="text-[11px] text-slate-500 font-normal">{o.customer_mobile}</div>}
                  </td>
                  <td className="p-3">
                    {o.delivery_address || <span className="text-slate-400 italic">No address provided</span>}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    ₹{o.total_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                      o.status === 'SENT_TO_OFFICE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-center flex items-center justify-center gap-2">
                    <Link href={`/orders/${o.id}`}>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                        View Details
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No retail tickets found. Add a new retail requirement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
