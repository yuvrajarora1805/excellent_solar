'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, ArrowLeft, Send } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  product_code: string;
  current_stock: number;
  selling_price?: number;
}

export default function NewRetailTicketPage() {
  const router = useRouter();

  // Retail Customers (Dealers)
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; mobile: string; address: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Products & Stock Item Selection
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Multi-Item Order List
  const [orderItems, setOrderItems] = useState<Array<{
    product_id: number;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>>([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch products
    fetch('/api/inventory/products')
      .then(res => res.json())
      .then(data => {
        const prodList = Array.isArray(data) ? data : (data.products || []);
        setProducts(prodList);
        if (prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
          setUnitPrice(prodList[0].selling_price || 0);
        }
      })
      .catch(console.error);

    // Fetch retail customers
    fetch('/api/customers?customer_type=RETAIL&limit=1000')
      .then(res => res.json())
      .then(data => {
        const custs = data.customers || [];
        setCustomers(custs);
        if (custs.length > 0) {
          setSelectedCustomerId(String(custs[0].id));
        }
      })
      .catch(console.error);
  }, []);

  const handleAddProduct = () => {
    const prod = products.find(p => p.id === Number(selectedProductId));
    if (!prod) return;

    const existingIdx = orderItems.findIndex(i => i.product_id === prod.id);
    if (existingIdx >= 0) {
      const updated = [...orderItems];
      const newQty = updated[existingIdx].quantity + quantity;
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: newQty,
        unit_price: unitPrice,
        line_total: newQty * unitPrice,
      };
      setOrderItems(updated);
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: prod.id,
          product_name: prod.name,
          product_code: prod.product_code || 'ITEM',
          quantity: quantity,
          unit_price: unitPrice,
          line_total: quantity * unitPrice,
        },
      ]);
    }
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = Number(e.target.value);
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitPrice(prod.selling_price || 0);
    }
  };

  const handleSubmitTicket = async () => {
    if (!selectedCustomerId) {
      alert('Please select a Retail Dealer!');
      return;
    }

    if (orderItems.length === 0) {
      alert('Please add at least one product.');
      return;
    }

    const selectedCust = customers.find(c => String(c.id) === selectedCustomerId);
    if (!selectedCust) return;

    const totalAmount = orderItems.reduce((sum, item) => sum + item.line_total, 0);

    try {
      setSubmitting(true);
      const res = await fetch('/api/orders/retail/requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCust.id,
          customer_name: selectedCust.name,
          customer_mobile: selectedCust.mobile,
          delivery_address: selectedCust.address,
          total_amount: totalAmount,
          items: orderItems.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send ticket');
      }

      alert('Retail Requirement Ticket created and stock reserved successfully!');
      router.push('/orders/retail');
    } catch (err: any) {
      alert(err.message || 'Error submitting ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Retail Order Ticket
          </h1>
          <p className="text-xs text-slate-500">
            Fill in dealer requirements and send to the office section for dispatch.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
            1. Select Retail Dealer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1">Retail Dealer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-2 border rounded-md text-sm bg-background"
            >
              <option value="" disabled>Select a saved Retail Dealer...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.mobile}</option>
              ))}
            </select>
            {customers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No retail dealers found. Please create one in the Customers section first.
              </p>
            )}
          </div>
          
          {selectedCustomerId && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">Address</label>
                <div className="text-sm font-medium">{customers.find(c => String(c.id) === selectedCustomerId)?.address || 'N/A'}</div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-500">Mobile</label>
                <div className="text-sm font-medium">{customers.find(c => String(c.id) === selectedCustomerId)?.mobile}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
            2. Product Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold mb-1">Select Product</label>
              <select
                value={selectedProductId}
                onChange={handleProductSelect}
                className="w-full p-2 border rounded-md text-sm bg-background font-medium"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  placeholder="Qty"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Price w/o GST</label>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  placeholder="Price"
                />
              </div>
            </div>
            <div>
              <Button
                type="button"
                onClick={handleAddProduct}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Product
              </Button>
            </div>
          </div>

          {orderItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden text-xs mt-4">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold flex justify-between items-center">
                <span>Requirements List</span>
                <span className="text-blue-700 dark:text-blue-400 font-extrabold text-sm">
                  Subtotal: ₹{orderItems.reduce((acc, i) => acc + i.line_total, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b font-bold text-slate-700 dark:text-slate-300">
                    <th className="p-2">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Price w/o GST</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2 font-bold text-slate-900 dark:text-white">
                        {item.product_name}
                      </td>
                      <td className="p-2 text-right">{item.quantity}</td>
                      <td className="p-2 text-right">₹{item.unit_price}</td>
                      <td className="p-2 text-right font-bold text-blue-700 dark:text-blue-400">
                        ₹{item.line_total?.toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItem(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmitTicket}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
        >
          <Send className="w-4 h-4 mr-2" />
          {submitting ? 'Sending...' : 'Send to Office'}
        </Button>
      </div>
    </div>
  );
}
