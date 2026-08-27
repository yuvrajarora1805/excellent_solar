'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Package, Layers, Tag, DollarSign, AlertTriangle } from 'lucide-react';

interface Product {
  id: number;
  product_code: string;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  specification?: string;
  unit: string;
  minimum_stock: number;
  current_stock: number;
  reserved_stock?: number;
  selling_price?: number;
  status: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/inventory/products/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading product details...</div>;
  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">{error || 'Product Not Found'}</h2>
        <Link href="/inventory/products">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Products</Button>
        </Link>
      </div>
    );
  }

  const isLowStock = product.current_stock <= product.minimum_stock;
  const availableStock = product.current_stock - (product.reserved_stock || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory/products">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">{product.product_code}</p>
          </div>
        </div>
        <Link href={`/inventory/products/${product.id}/edit`}>
          <Button><Edit className="w-4 h-4 mr-2" />Edit Product</Button>
        </Link>
      </div>

      {isLowStock && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-3 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Low Stock Alert</p>
            <p className="text-xs">Current stock ({product.current_stock} {product.unit}) is at or below minimum threshold ({product.minimum_stock} {product.unit}).</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Current Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{product.current_stock} <span className="text-base font-normal text-slate-500">{product.unit}</span></div>
            <p className="text-xs text-slate-500 mt-1">Minimum required: {product.minimum_stock} {product.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Available Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{availableStock} <span className="text-base font-normal text-slate-500">{product.unit}</span></div>
            <p className="text-xs text-slate-500 mt-1">Reserved: {product.reserved_stock || 0} {product.unit}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Selling Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{product.selling_price?.toLocaleString('en-IN') || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Per {product.unit}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <span className="text-slate-500">Category:</span>
              <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <Tag className="w-4 h-4 text-slate-400" />
                {product.category}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Brand & Model:</span>
              <p className="font-medium text-slate-900 dark:text-white mt-0.5">
                {[product.brand, product.model].filter(Boolean).join(' - ') || 'N/A'}
              </p>
            </div>
          </div>

          {product.specification && (
            <div className="pt-2 border-t text-sm">
              <span className="text-slate-500">Specifications:</span>
              <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                {product.specification}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
