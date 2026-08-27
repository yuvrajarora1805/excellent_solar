'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import { FTRImportModal } from '@/components/inventory/ftr-import-modal';

interface StockSummary {
  id: number;
  product_code: string;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
}

export default function StockPage() {
  const [stock, setStock] = useState<StockSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isFtrOpen, setIsFtrOpen] = useState(false);


  useEffect(() => {
    fetchStock();
  }, [search, category]);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      const response = await fetch(`/api/inventory/stock?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStock(data.stock || []);
      }
    } catch (error) {
      console.error('Failed to fetch stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockCount = stock.filter(s => s.current_stock <= s.minimum_stock).length;
  const totalStock = stock.reduce((sum, s) => sum + s.current_stock, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Stock Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor inventory stock levels, solar panel flasher test reports, and transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/flasher-reports">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2">
              <Package className="w-4 h-4" />
              View Panel Serials & Flasher Details
            </Button>
          </Link>
          <Button onClick={() => setIsFtrOpen(true)} variant="outline" className="gap-2">
            Import FTR PDF (OCR)
          </Button>
          <Link href="/inventory/stock/adjust">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
          </Link>
        </div>
      </div>

      <FTRImportModal
        isOpen={isFtrOpen}
        onClose={() => setIsFtrOpen(false)}
        onSuccess={() => {
          fetchStock();
          setIsFtrOpen(false);
        }}
        products={stock}
      />



      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Product Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stock.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-400" />
              <span className="text-2xl font-bold">{totalStock}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
          <CardDescription>Current stock levels across all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg border overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Current Stock</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {stock.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.product_code}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{item.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                        {item.current_stock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          In Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

