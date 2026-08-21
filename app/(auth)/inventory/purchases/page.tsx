'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Eye, Trash2 } from 'lucide-react';

interface Purchase {
  id: number;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  total_amount: number;
  created_by_name: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchPurchases();
  }, [search, page]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/inventory/purchases?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will reverse the stock update.')) return;

    try {
      const response = await fetch(`/api/inventory/purchases/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchPurchases();
      } else {
        alert('Failed to delete purchase');
      }
    } catch (error) {
      alert('Failed to delete purchase');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Purchase Invoices</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage supplier purchases and stock entries</p>
        </div>
        <Link href="/inventory/purchases/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Purchase
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by invoice number or supplier..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="pt-6"><div className="text-center py-8">Loading...</div></CardContent></Card>
      ) : (
        <>
          <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Invoice #</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Supplier</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-3 text-sm font-medium">{purchase.invoice_number}</td>
                    <td className="px-4 py-3 text-sm">{new Date(purchase.invoice_date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-sm">{purchase.supplier_name}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{purchase.total_amount?.toLocaleString('en-IN') || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/inventory/purchases/${purchase.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(purchase.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-slate-600">Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="flex items-center text-sm">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
