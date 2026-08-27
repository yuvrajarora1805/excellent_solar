'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

interface Product {
  id: number;
  product_code: string;
  name: string;
  unit: string;
  current_stock: number;
}

export default function StockAdjustPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    product_id: '',
    new_quantity: '',
    reason: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setFetching(true);
      const res = await fetch('/api/inventory/products?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleProductChange = (productIdStr: string) => {
    const pId = parseInt(productIdStr);
    const prod = products.find(p => p.id === pId) || null;
    setSelectedProduct(prod);
    setFormData(prev => ({
      ...prev,
      product_id: productIdStr,
      new_quantity: prod ? prod.current_stock.toString() : '',
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.product_id) newErrors.product_id = 'Product selection is required';
    if (formData.new_quantity === '' || isNaN(parseInt(formData.new_quantity)) || parseInt(formData.new_quantity) < 0) {
      newErrors.new_quantity = 'Valid new quantity is required';
    }
    if (!formData.reason.trim()) newErrors.reason = 'Reason for adjustment is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/inventory/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(formData.product_id),
          new_quantity: parseInt(formData.new_quantity),
          reason: formData.reason,
        }),
      });

      if (response.ok) {
        router.push('/inventory/stock');
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to adjust stock' });
      }
    } catch (error) {
      setErrors({ form: 'Failed to adjust stock' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-12">Loading products...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory/stock">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Stock</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Stock Adjustment</h1>
          <p className="text-slate-600 dark:text-slate-400">Audit, adjust or reconcile inventory counts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Adjustment Form</CardTitle>
            <CardDescription>Select product and specify new physical stock count</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                {errors.form}
              </div>
            )}

            <div>
              <Label htmlFor="product_id">Select Product *</Label>
              <select
                id="product_id"
                value={formData.product_id}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                disabled={loading}
              >
                <option value="">Choose a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.product_code} - {p.name} (Current: {p.current_stock} {p.unit})</option>
                ))}
              </select>
              {errors.product_id && <p className="text-sm text-red-600 mt-1">{errors.product_id}</p>}
            </div>

            {selectedProduct && (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-md text-sm flex justify-between">
                <span className="text-slate-500">Current Recorded Stock:</span>
                <span className="font-semibold">{selectedProduct.current_stock} {selectedProduct.unit}</span>
              </div>
            )}

            <div>
              <Label htmlFor="new_quantity">New Actual Physical Stock *</Label>
              <Input
                id="new_quantity"
                type="number"
                min="0"
                value={formData.new_quantity}
                onChange={(e) => setFormData({ ...formData, new_quantity: e.target.value })}
                placeholder="Enter physical count"
                className={errors.new_quantity ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.new_quantity && <p className="text-sm text-red-600 mt-1">{errors.new_quantity}</p>}
            </div>

            <div>
              <Label htmlFor="reason">Reason for Adjustment *</Label>
              <textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Physical Audit Count, Damaged in transit, Supplier replacement..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                disabled={loading}
              />
              {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason}</p>}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Save Stock Adjustment'}
              </Button>
              <Link href="/inventory/stock">
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
