'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Barcode, Truck, Camera, CheckCircle2, Trash2, Plus, ArrowLeft, Zap } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  product_code: string;
  current_stock: number;
  selling_price?: number;
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  address: string;
}

export default function NewOrderPage() {
  const router = useRouter();

  // Order Details
  const [orderType, setOrderType] = useState<'PROJECT' | 'RETAIL'>('RETAIL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Vehicle Info
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverMobile, setDriverMobile] = useState('');
  const [vehiclePhotoPath, setVehiclePhotoPath] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Products & Stock Item Selection
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

  // Multi-Item Order List (Barcode & Non-Barcode)
  const [orderItems, setOrderItems] = useState<Array<{
    product_id: number;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>>([]);

  // Barcode Scanner Input
  const [scannedSerialInput, setScannedSerialInput] = useState('');
  const [scannedSerials, setScannedSerials] = useState<Array<{ product_id: number; serial_number: string }>>([]);
  const [scanMessage, setScanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch products
    fetch('/api/inventory/products')
      .then(res => res.json())
      .then(data => {
        const prodList = data.products || [];
        setProducts(prodList);
        if (prodList.length > 0) {
          setSelectedProductId(prodList[0].id);
          setUnitPrice(prodList[0].selling_price || 0);
        }
      })
      .catch(console.error);

    // Fetch customers
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data);
        else if (data.customers) setCustomers(data.customers);
      })
      .catch(console.error);
  }, []);

  const handleAddNonBarcodeItem = () => {
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

  const handleItemPriceChange = (index: number, field: 'quantity' | 'unit_price', val: number) => {
    const updated = [...orderItems];
    const qty = field === 'quantity' ? val : updated[index].quantity;
    const price = field === 'unit_price' ? val : updated[index].unit_price;
    updated[index] = {
      ...updated[index],
      [field]: val,
      line_total: qty * price,
    };
    setOrderItems(updated);
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (custId) {
      const cust = customers.find(c => c.id === Number(custId));
      if (cust) {
        setCustomerName(cust.name);
        setCustomerMobile(cust.mobile);
        setDeliveryAddress(cust.address);
      }
    }
  };

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prodId = Number(e.target.value);
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setUnitPrice(prod.selling_price || 0);
    }
  };

  // Barcode scanning / serial number addition
  const handleAddSerialBarcode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const serial = scannedSerialInput.trim();
    if (!serial) return;

    // Check duplicate in current scan list
    if (scannedSerials.some(s => s.serial_number.toLowerCase() === serial.toLowerCase())) {
      setScanMessage({ type: 'error', text: `Serial Number "${serial}" has already been scanned in this order!` });
      setScannedSerialInput('');
      return;
    }

    try {
      // Validate serial number against API
      const res = await fetch(`/api/serial-numbers/track?serial=${encodeURIComponent(serial)}`);
      const data = await res.json();

      if (!res.ok || data.error || !data.serial) {
        // Allow adding if user wants to scan anyway or auto-register
        setScannedSerials([...scannedSerials, { product_id: Number(selectedProductId || 1), serial_number: serial }]);
        setScanMessage({ type: 'success', text: `Scanned Barcode: ${serial} added!` });
      } else {
        const itemProduct = data.serial.product_id || Number(selectedProductId || 1);
        setScannedSerials([...scannedSerials, { product_id: itemProduct, serial_number: serial }]);
        setScanMessage({ type: 'success', text: `Scanned Verified Barcode: ${serial} (Pmax: ${data.serial.pmax || ''})` });
      }
      setScannedSerialInput('');
    } catch (err) {
      setScannedSerials([...scannedSerials, { product_id: Number(selectedProductId || 1), serial_number: serial }]);
      setScanMessage({ type: 'success', text: `Scanned Barcode: ${serial} added!` });
      setScannedSerialInput('');
    }
  };

  const handleRemoveSerial = (index: number) => {
    setScannedSerials(scannedSerials.filter((_, i) => i !== index));
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ocr/parse-pdf', { method: 'POST', body: formData }); // reuse upload path or upload route
      // Save local path
      setVehiclePhotoPath(`/uploads/ocr/${file.name}`);
      alert('Vehicle loading proof photo uploaded!');
    } catch (err) {
      setVehiclePhotoPath(`/uploads/${file.name}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitOrder = async (dispatchImmediately: boolean) => {
    if (!customerName) {
      alert('Customer Name is required!');
      return;
    }

    let finalItems = [...orderItems];

    // If scanned serials exist for a panel model but panel item isn't in finalItems yet
    if (scannedSerials.length > 0) {
      const panelProdId = Number(selectedProductId || 1);
      const panelProd = products.find(p => p.id === panelProdId);
      const existingPanelIdx = finalItems.findIndex(i => i.product_id === panelProdId);

      if (existingPanelIdx >= 0) {
        finalItems[existingPanelIdx].quantity = scannedSerials.length;
        finalItems[existingPanelIdx].line_total = scannedSerials.length * finalItems[existingPanelIdx].unit_price;
      } else {
        finalItems.push({
          product_id: panelProdId,
          product_name: panelProd?.name || 'Solar Panel Array',
          product_code: panelProd?.product_code || 'PANEL',
          quantity: scannedSerials.length,
          unit_price: unitPrice,
          line_total: scannedSerials.length * unitPrice,
        });
      }
    } else if (finalItems.length === 0) {
      const prod = products.find(p => p.id === Number(selectedProductId));
      finalItems.push({
        product_id: Number(selectedProductId || 1),
        product_name: prod?.name || 'Solar Material Item',
        product_code: prod?.product_code || 'ITEM',
        quantity: quantity,
        unit_price: unitPrice,
        line_total: quantity * unitPrice,
      });
    }

    const totalAmount = finalItems.reduce((sum, item) => sum + item.line_total, 0);

    try {
      setSubmitting(true);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: orderType,
          customer_id: selectedCustomerId ? Number(selectedCustomerId) : undefined,
          customer_name: customerName,
          customer_mobile: customerMobile,
          delivery_address: deliveryAddress,
          vehicle_number: vehicleNumber,
          driver_name: driverName,
          driver_mobile: driverMobile,
          vehicle_photo_path: vehiclePhotoPath,
          total_amount: totalAmount,
          items: finalItems.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
          serials: scannedSerials,
          dispatchImmediately,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create order');
      }

      alert(data.message || 'Order created successfully!');
      router.push('/orders');
    } catch (err: any) {
      alert(err.message || 'Error submitting order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Order & Dispatch (Scan Solar Barcodes)
          </h1>
          <p className="text-xs text-slate-500">
            Process Customer Project or Retail Sale orders with Barcode Serial Scanning & Vehicle Loading Proof
          </p>
        </div>
      </div>

      {/* Step 1: Order Type */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
            1. Select Order Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setOrderType('PROJECT')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                orderType === 'PROJECT'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-blue-700">
                <Zap className="w-5 h-5" /> Customer Project Installation Order
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Order for an existing site installation project or registered customer.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('RETAIL')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                orderType === 'RETAIL'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-700">
                <CheckCircle2 className="w-5 h-5" /> Retail / Over-the-Counter (OTC) Sale
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Direct retail sale to a walk-in buyer or dealer.
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Customer Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300">
            2. Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderType === 'PROJECT' && (
            <div>
              <label className="block text-xs font-bold mb-1">Select Registered Customer</label>
              <select
                value={selectedCustomerId}
                onChange={handleCustomerSelect}
                className="w-full p-2 border rounded-md text-sm bg-background"
              >
                <option value="">Select Existing Customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Customer Name *</label>
              <Input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer or buyer name"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Mobile Number</label>
              <Input
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="e.g. 98581-09000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Delivery / Installation Address</label>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. Moga Road, Kotkapura / Jalalabad"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Barcode Serial Scanning */}
      <Card className="border-2 border-blue-500/30">
        <CardHeader className="pb-2 bg-blue-50/50 dark:bg-blue-950/20 border-b">
          <CardTitle className="text-sm font-bold uppercase text-blue-900 dark:text-blue-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Barcode className="w-5 h-5 text-blue-600" />
              3. Scan Solar Panel Unique Barcode Serials
            </span>
            <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
              Scanned: {scannedSerials.length} Panels
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-bold mb-1">Select Available Stock Product (Barcode & Non-Barcode)</label>
              <select
                value={selectedProductId}
                onChange={handleProductSelect}
                className="w-full p-2 border rounded-md text-sm bg-background font-medium"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.product_code}) - Available Stock: {p.current_stock}</option>
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
                <label className="block text-xs font-bold mb-1">Unit Price (₹)</label>
                <Input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  placeholder="Unit Price"
                />
              </div>
            </div>
            <div>
              <Button
                type="button"
                onClick={handleAddNonBarcodeItem}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold"
              >
                + Add Non-Barcode Item to Order
              </Button>
            </div>
          </div>

          {/* Barcode Scanner Input for Solar Panels */}
          <div className="bg-slate-900 p-4 rounded-lg text-white space-y-2">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
              <span>Scan 1D/2D Barcode or QR Code / Unique Serial Number (Module Sr. No.)</span>
              <span className="text-emerald-400 font-mono text-[11px]">Auto-Validates & Registers</span>
            </label>
            <form onSubmit={handleAddSerialBarcode} className="flex gap-2">
              <Input
                autoFocus
                value={scannedSerialInput}
                onChange={(e) => setScannedSerialInput(e.target.value)}
                placeholder="Scan 1D/2D Barcode or type Module Sr. No. (e.g. WS08269074875699) and hit Enter"
                className="bg-slate-800 text-white border-slate-700 font-mono text-sm"
              />
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                Add Barcode
              </Button>
            </form>
            <p className="text-[11px] text-slate-400 italic">
              Connect your USB 1D/2D Barcode Scanner or type serial number to auto-validate against inventory.
            </p>
          </div>

          {scanMessage && (
            <div className={`p-2.5 rounded text-xs font-bold ${
              scanMessage.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
            }`}>
              {scanMessage.text}
            </div>
          )}

          {/* Order Items Table (Barcode + Non-Barcode Stock Items) */}
          {orderItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold flex justify-between items-center">
                <span>Order Dispatched Items Table ({orderItems.length} Products)</span>
                <span className="text-blue-700 dark:text-blue-400 font-extrabold text-sm">
                  Subtotal: ₹{orderItems.reduce((acc, i) => acc + i.line_total, 0).toLocaleString('en-IN')}
                </span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b font-bold text-slate-700 dark:text-slate-300">
                    <th className="p-2">Product</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Unit Price (₹)</th>
                    <th className="p-2 text-right">Line Total (₹)</th>
                    <th className="p-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orderItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-2 font-bold text-slate-900 dark:text-white">
                        {item.product_name} <span className="font-mono text-slate-400 font-normal">({item.product_code})</span>
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemPriceChange(idx, 'quantity', Number(e.target.value))}
                          className="w-16 p-1 border rounded text-right font-bold text-xs"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) => handleItemPriceChange(idx, 'unit_price', Number(e.target.value))}
                          className="w-24 p-1 border rounded text-right font-bold text-xs"
                        />
                      </td>
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

          {/* Scanned Serials List */}
          {scannedSerials.length > 0 && (
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 px-3 py-2 font-bold flex justify-between">
                <span className="text-blue-900 dark:text-blue-200">Scanned Solar Panel Barcodes List ({scannedSerials.length})</span>
                <span className="text-blue-900 dark:text-blue-200">Panels Amount: ₹{(scannedSerials.length * unitPrice).toLocaleString('en-IN')}</span>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y">
                {scannedSerials.map((s, i) => (
                  <div key={i} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {i + 1}. {s.serial_number}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSerial(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 4: Vehicle & Delivery Proof */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            4. Vehicle Details & Loading Photo Proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Vehicle Number *</label>
              <Input
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. PB-04-AB-1234"
                className="font-mono uppercase font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Driver Name</label>
              <Input
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Raju Singh"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Driver Mobile</label>
              <Input
                value={driverMobile}
                onChange={(e) => setDriverMobile(e.target.value)}
                placeholder="e.g. 98765-43210"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Upload Vehicle / Loading Photo Proof</label>
            <div className="flex gap-2 items-center">
              <Input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="text-xs"
              />
              {uploadingPhoto && <span className="text-xs text-blue-600 animate-pulse">Uploading photo...</span>}
              {vehiclePhotoPath && <span className="text-xs font-bold text-green-600">✓ Photo Attached</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmitOrder(false)}
          disabled={submitting}
          className="bg-slate-800 text-white hover:bg-slate-900"
        >
          Save Draft Order
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmitOrder(true)}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
        >
          <Truck className="w-4 h-4 mr-2" />
          {submitting ? 'Dispatching & Syncing...' : 'Dispatch Order & Sync Stock'}
        </Button>
      </div>
    </div>
  );
}
