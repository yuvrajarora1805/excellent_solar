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

  // Retail Customer (Free text instead of DB lookup)
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; mobile: string; address: string }>>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Products & Stock Item Selection
  const [products, setProducts] = useState<Product[]>([]);
  const [productInput, setProductInput] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Multi-Item Order List
  const [orderItems, setOrderItems] = useState<Array<{
    product_id: number | null; // null for custom materials
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>>([]);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch products for autocomplete
    fetch('/api/inventory/products')
      .then(res => res.json())
      .then(data => {
        const prodList = Array.isArray(data) ? data : (data.products || []);
        setProducts(prodList);
      })
      .catch(console.error);

    // Fetch retail customers for autocomplete
    fetch('/api/customers?customer_type=RETAIL&limit=1000')
      .then(res => res.json())
      .then(data => {
        setCustomers(data.customers || []);
      })
      .catch(console.error);
  }, []);

  // When user types in dealer name, auto-fill details if it matches exactly
  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    const match = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
    if (match) {
      setCustomerMobile(match.mobile || '');
      setCustomerAddress(match.address || '');
    }
  };

  // When user types in product name, auto-fill price if it matches exactly
  const handleProductInputChange = (val: string) => {
    setProductInput(val);
    const match = products.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (match) {
      setUnitPrice(match.selling_price || 0);
    }
  };

  const handleAddProduct = () => {
    const nameStr = productInput.trim();
    if (!nameStr) return;

    // Check if it matches an existing product exactly
    const existingProduct = products.find(p => p.name.toLowerCase() === nameStr.toLowerCase());
    const prodId = existingProduct ? existingProduct.id : null;
    const finalName = existingProduct ? existingProduct.name : nameStr;

    // Check if already in list
    const existingIdx = orderItems.findIndex(i => 
      (prodId && i.product_id === prodId) || (!prodId && i.product_name.toLowerCase() === finalName.toLowerCase())
    );

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
          product_id: prodId,
          product_name: finalName,
          quantity: quantity,
          unit_price: unitPrice,
          line_total: quantity * unitPrice,
        },
      ]);
    }

    setProductInput('');
    setQuantity(1);
    setUnitPrice(0);
  };

  const handleRemoveOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmitTicket = async () => {
    if (!customerName.trim()) {
      alert('Please enter a Retail Dealer Name!');
      return;
    }

    if (orderItems.length === 0) {
      alert('Please add at least one product/material.');
      return;
    }

    const totalAmount = orderItems.reduce((sum, item) => sum + item.line_total, 0);

    try {
      setSubmitting(true);
      const res = await fetch('/api/orders/retail/requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: null, // No longer strictly linked
          customer_name: customerName.trim(),
          customer_mobile: customerMobile.trim(),
          delivery_address: customerAddress.trim(),
          total_amount: totalAmount,
          items: orderItems.map(i => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            is_custom: i.product_id === null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to send ticket');
      }

      alert('Retail Requirement created successfully!');
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
            Enter dealer details and requirements. Sends directly to dispatch.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
            1. Dealer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <label className="block text-xs font-bold mb-1">Dealer / Walk-in Name *</label>
              <Input
                placeholder="Search or Type new Dealer..."
                value={customerName}
                onChange={(e) => {
                  handleCustomerNameChange(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
              />
              {showCustomerDropdown && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(customerName.toLowerCase()))
                    .map(c => (
                      <li
                        key={c.id}
                        className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700 last:border-0"
                        onClick={() => {
                          handleCustomerNameChange(c.name);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                        {c.mobile && <div className="text-xs text-slate-500">{c.mobile}</div>}
                      </li>
                  ))}
                  {customerName && !customers.some(c => c.name.toLowerCase() === customerName.toLowerCase()) && (
                    <li className="px-3 py-2 text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 italic">
                      + Create new dealer: &quot;{customerName}&quot;
                    </li>
                  )}
                  {customers.length === 0 && !customerName && (
                    <li className="px-3 py-2 text-sm text-slate-500 italic">Start typing to create a dealer...</li>
                  )}
                </ul>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mobile Number</label>
              <Input
                placeholder="Optional"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Address</label>
            <Input
              placeholder="Delivery address (Optional)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
          </div>
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
            <div className="relative">
              <label className="block text-xs font-bold mb-1">Type Material or Select</label>
              <Input
                placeholder="E.g. 5kW Inverter or Custom Wire"
                value={productInput}
                onChange={(e) => {
                  handleProductInputChange(e.target.value);
                  setShowProductDropdown(true);
                }}
                onFocus={() => setShowProductDropdown(true)}
                onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
              />
              {showProductDropdown && (
                <ul className="absolute z-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {products
                    .filter(p => p.name.toLowerCase().includes(productInput.toLowerCase()))
                    .map(p => (
                      <li
                        key={p.id}
                        className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm border-b border-slate-100 dark:border-slate-700 last:border-0"
                        onClick={() => {
                          handleProductInputChange(p.name);
                          setShowProductDropdown(false);
                        }}
                      >
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                        {p.selling_price && <div className="text-xs text-slate-500">₹{p.selling_price}</div>}
                      </li>
                  ))}
                  {productInput && !products.some(p => p.name.toLowerCase() === productInput.toLowerCase()) && (
                    <li className="px-3 py-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 italic">
                      + Create custom material: &quot;{productInput}&quot;
                    </li>
                  )}
                  {products.length === 0 && !productInput && (
                    <li className="px-3 py-2 text-sm text-slate-500 italic">Start typing to search inventory...</li>
                  )}
                </ul>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold mb-1">Qty</label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  placeholder="Qty"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Price/Unit (₹)</label>
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
                disabled={!productInput.trim()}
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
                    <th className="p-2">Product / Material</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Price/Unit</th>
                    <th className="p-2 text-right">Total</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {item.product_name}
                        {item.product_id === null && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded-full uppercase">Custom</span>
                        )}
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
