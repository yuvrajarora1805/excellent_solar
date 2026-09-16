'use client';

import React, { useState, useEffect } from 'react';
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
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const [productSerials, setProductSerials] = useState<any[]>([]);
  const [loadingSerials, setLoadingSerials] = useState(false);

  const toggleExpand = async (productId: number) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
      setProductSerials([]);
      return;
    }
    setExpandedProductId(productId);
    setLoadingSerials(true);
    try {
      const res = await fetch(`/api/serial-numbers?product_id=${productId}`);
      if (res.ok) {
        const data = await res.json();
        const allSerials = data.serials || data || [];
        allSerials.sort((a: any, b: any) => {
          if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
          if (a.status !== 'AVAILABLE' && b.status === 'AVAILABLE') return 1;
          return 0;
        });
        setProductSerials(allSerials);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSerials(false);
    }
  };


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
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.product_code}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{item.category}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {item.current_stock} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => toggleExpand(item.id)}
                          >
                            {expandedProductId === item.id ? 'Hide Serials' : 'View Serials'}
                          </Button>
                        </td>
                      </tr>
                      {expandedProductId === item.id && (
                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                          <td colSpan={4} className="p-4 border-t border-slate-200 dark:border-slate-700">
                            {loadingSerials ? (
                              <div className="text-center text-sm text-slate-500 animate-pulse">Loading serial numbers...</div>
                            ) : productSerials.length === 0 ? (
                              <div className="text-center text-sm text-slate-500">No serial numbers recorded in stock for this product.</div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {productSerials.map((s, idx) => {
                                  const isAvailable = s.status === 'AVAILABLE';
                                  return (
                                    <div key={idx} className={`p-2 rounded border flex flex-col gap-1 items-center justify-center ${isAvailable ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'}`}>
                                      <span className={`text-xs font-mono font-bold text-center break-all ${isAvailable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {s.serial_number}
                                      </span>
                                      <span className={`text-[9px] font-black uppercase ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                                        {isAvailable ? 'In Stock' : (s.status === 'ISSUED' ? 'Sold Out' : s.status)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

