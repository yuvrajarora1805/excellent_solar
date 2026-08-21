'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  product_code: string;
  name: string;
  unit: string;
}

interface PurchaseItem {
  product_id: number;
  quantity: number;
  rate: number;
  amount: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([
    { product_id: 0, quantity: 1, rate: 0, amount: 0 }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setFetching(true);
      const [supRes, prodRes] = await Promise.all([
        fetch('/api/inventory/suppliers'),
        fetch('/api/inventory/products?limit=1000'),
      ]);

      if (supRes.ok) {
        const data = await supRes.json();
        setSuppliers(data.suppliers || []);
      }
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setFetching(false);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: 0, quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items];
    const numValue = typeof value === 'string' && (field === 'quantity' || field === 'rate') ? parseFloat(value) || 0 : value;

    if (field === 'quantity' || field === 'rate') {
      (newItems[index] as any)[field] = numValue;
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    } else {
      newItems[index][field] = numValue as any;
    }

    setItems(newItems);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplier_id) {
      newErrors.supplier_id = 'Supplier is required';
    }
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
    }
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }

    items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product`] = 'Product is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.rate < 0) {
        newErrors[`item_${index}_rate`] = 'Rate cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/inventory/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          supplier_id: parseInt(formData.supplier_id),
          items: items.filter(item => item.product_id > 0 && item.quantity > 0),
        }),
      });

      if (response.ok) {
        router.push('/inventory/purchases');
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to create purchase' });
      }
    } catch (error) {
      setErrors({ form: 'Failed to create purchase' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory/purchases">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Purchase Invoice</h1>
          <p className="text-slate-600 dark:text-slate-400">Enter purchase details to update stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
            <CardDescription>Enter supplier and invoice details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                {errors.form}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="supplier_id">Supplier *</Label>
                <div className="flex gap-2">
                  <select
                    id="supplier_id"
                    name="supplier_id"
                    value={formData.supplier_id}
                    onChange={(e) => {
                      setFormData({ ...formData, supplier_id: e.target.value });
                      if (errors.supplier_id) setErrors({ ...errors, supplier_id: '' });
                    }}
                    className="flex-1 px-3 py-2 border border-input rounded-md bg-background"
                    disabled={loading}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <Link href="/inventory/suppliers/new">
                    <Button type="button" variant="outline" size="sm">+</Button>
                  </Link>
                </div>
                {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
              </div>

              <div>
                <Label htmlFor="invoice_number">Invoice Number *</Label>
                <Input
                  id="invoice_number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={(e) => {
                    setFormData({ ...formData, invoice_number: e.target.value });
                    if (errors.invoice_number) setErrors({ ...errors, invoice_number: '' });
                  }}
                  className={errors.invoice_number ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.invoice_number && <p className="text-sm text-red-600 mt-1">{errors.invoice_number}</p>}
              </div>

              <div>
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input
                  id="invoice_date"
                  name="invoice_date"
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => {
                    setFormData({ ...formData, invoice_date: e.target.value });
                    if (errors.invoice_date) setErrors({ ...errors, invoice_date: '' });
                  }}
                  className={errors.invoice_date ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.invoice_date && <p className="text-sm text-red-600 mt-1">{errors.invoice_date}</p>}
              </div>
            </div>

            <div>
              <Label>Items</Label>
              <div className="space-y-3 mt-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex-1">
                      <select
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                        disabled={loading}
                      >
                        <option value="0">Select Product</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.product_code} - {p.name}</option>
                        ))}
                      </select>
                      {errors[`item_${index}_product`] && <p className="text-sm text-red-600 mt-1">{errors[`item_${index}_product`]}</p>}
                    </div>

                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        disabled={loading}
                      />
                      {errors[`item_${index}_quantity`] && <p className="text-sm text-red-600">{errors[`item_${index}_quantity`]}</p>}
                    </div>

                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(index, 'rate', e.target.value)}
                        placeholder="Rate"
                        disabled={loading}
                      />
                      {errors[`item_${index}_rate`] && <p className="text-sm text-red-600">{errors[`item_${index}_rate`]}</p>}
                    </div>

                    <div className="w-28 py-2 text-sm text-right">
                      ₹{(item.amount || 0).toFixed(2)}
                    </div>

                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={loading}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              <span className="font-medium">Total Amount:</span>
              <span className="text-xl font-bold">₹{totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Creating...' : 'Create Purchase'}
              </Button>
              <Link href="/inventory/purchases">
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
