'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    product_code: '',
    name: '',
    category: 'Solar Panel',
    brand: '',
    model: '',
    specification: '',
    unit: 'Piece',
    minimum_stock: '0',
    current_stock: '0',
    selling_price: '0',
  });

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setFetchingData(true);
      const res = await fetch(`/api/inventory/products/${id}`);
      if (res.ok) {
        const product = await res.json();
        setFormData({
          product_code: product.product_code || '',
          name: product.name || '',
          category: product.category || 'Solar Panel',
          brand: product.brand || '',
          model: product.model || '',
          specification: product.specification || '',
          unit: product.unit || 'Piece',
          minimum_stock: product.minimum_stock?.toString() || '0',
          current_stock: product.current_stock?.toString() || '0',
          selling_price: product.selling_price?.toString() || '0',
        });
      } else {
        setErrors({ form: 'Product not found.' });
      }
    } catch (error) {
      setErrors({ form: 'Failed to fetch product details.' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_code.trim()) {
      newErrors.product_code = 'Product code is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (isNaN(parseInt(formData.minimum_stock)) || parseInt(formData.minimum_stock) < 0) {
      newErrors.minimum_stock = 'Invalid minimum stock';
    }
    if (isNaN(parseInt(formData.current_stock)) || parseInt(formData.current_stock) < 0) {
      newErrors.current_stock = 'Invalid current stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/inventory/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          minimum_stock: parseInt(formData.minimum_stock),
          current_stock: parseInt(formData.current_stock),
          selling_price: parseFloat(formData.selling_price),
        }),
      });

      if (response.ok) {
        router.push('/inventory/products');
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to update product' });
      }
    } catch (error) {
      setErrors({ form: 'Failed to update product' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <div className="p-8 text-center text-on-surface-variant">Loading product details...</div>;
  }

  if (errors.form === 'Product not found.') {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
         <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
         <p className="text-on-surface mb-4">Product not found.</p>
         <Link href="/inventory/products">
           <Button variant="outline">Back to Products</Button>
         </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory/products">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-slate-600 dark:text-slate-400">Update inventory product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Update product details and stock information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                {errors.form}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="product_code">Product Code *</Label>
                <Input
                  id="product_code"
                  name="product_code"
                  value={formData.product_code}
                  onChange={handleChange}
                  placeholder="e.g., PANEL-550-001"
                  className={errors.product_code ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.product_code && <p className="text-sm text-red-600 mt-1">{errors.product_code}</p>}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="Solar Panel">Solar Panel</option>
                  <option value="Inverter">Inverter</option>
                  <option value="Structure">Structure</option>
                  <option value="Cable">Cable</option>
                  <option value="Connector">Connector</option>
                  <option value="Earthing">Earthing</option>
                  <option value="Box">ACDB/DCDB</option>
                  <option value="Breaker">Breaker</option>
                  <option value="Accessories">Accessories</option>
                </select>
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., 550W Solar Panel"
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input id="brand" name="brand" value={formData.brand} onChange={handleChange} placeholder="e.g., Tata Solar" disabled={loading} />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" value={formData.model} onChange={handleChange} placeholder="e.g., TS550" disabled={loading} />
              </div>
            </div>

            <div>
              <Label htmlFor="specification">Specification</Label>
              <textarea
                id="specification"
                name="specification"
                value={formData.specification}
                onChange={handleChange}
                placeholder="Detailed specifications..."
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                disabled={loading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="Piece">Piece</option>
                  <option value="Meter">Meter</option>
                  <option value="Kg">Kg</option>
                  <option value="Set">Set</option>
                </select>
              </div>

              <div>
                <Label htmlFor="minimum_stock">Minimum Stock</Label>
                <Input
                  id="minimum_stock"
                  name="minimum_stock"
                  type="number"
                  value={formData.minimum_stock}
                  onChange={handleChange}
                  className={errors.minimum_stock ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.minimum_stock && <p className="text-sm text-red-600 mt-1">{errors.minimum_stock}</p>}
              </div>

              <div>
                <Label htmlFor="current_stock">Current Stock</Label>
                <Input
                  id="current_stock"
                  name="current_stock"
                  type="number"
                  value={formData.current_stock}
                  onChange={handleChange}
                  className={errors.current_stock ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.current_stock && <p className="text-sm text-red-600 mt-1">{errors.current_stock}</p>}
              </div>

              <div>
                <Label htmlFor="selling_price">Selling Price (₹)</Label>
                <Input
                  id="selling_price"
                  name="selling_price"
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={handleChange}
                  className={errors.selling_price ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.selling_price && <p className="text-sm text-red-600 mt-1">{errors.selling_price}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/inventory/products">
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
