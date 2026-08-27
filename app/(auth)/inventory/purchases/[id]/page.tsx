'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Calendar, FileText, User } from 'lucide-react';

interface PurchaseItem {
  id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface PurchaseDetail {
  id: number;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  total_amount: number;
  remarks?: string;
  created_by_name: string;
  created_at: string;
  items: PurchaseItem[];
}

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchase();
  }, [id]);

  const fetchPurchase = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/purchases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPurchase(data);
      } else {
        setError('Purchase invoice not found');
      }
    } catch (err) {
      setError('Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading purchase details...</div>;
  }

  if (error || !purchase) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">{error || 'Purchase Not Found'}</h2>
        <Link href="/inventory/purchases">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Purchases</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory/purchases">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Invoice #{purchase.invoice_number}</h1>
            <p className="text-slate-600 dark:text-slate-400">Purchase Invoice Details</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Supplier Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Supplier Name:</span>
              <p className="font-medium text-slate-900 dark:text-white">{purchase.supplier_name}</p>
            </div>
            <div>
              <span className="text-slate-500">Created By:</span>
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {purchase.created_by_name || 'System User'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Invoice Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Invoice Date:</span>
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(purchase.invoice_date).toLocaleDateString('en-IN')}
              </p>
            </div>
            {purchase.remarks && (
              <div>
                <span className="text-slate-500">Remarks:</span>
                <p className="font-medium text-slate-900 dark:text-white">{purchase.remarks}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Purchased Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Product Name</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Rate (₹)</th>
                  <th className="px-4 py-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {purchase.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.product_code || '-'}</td>
                    <td className="px-4 py-3 font-medium">{item.product_name || `Product #${item.product_id}`}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">₹{item.rate?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-medium">₹{item.amount?.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold">Total Amount:</td>
                  <td className="px-4 py-3 text-right font-bold text-base text-primary">
                    ₹{purchase.total_amount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
