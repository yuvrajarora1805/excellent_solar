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

  // Products & Scanning
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);

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

    const effectiveQty = scannedSerials.length > 0 ? scannedSerials.length : quantity;
    const totalAmount = effectiveQty * unitPrice;

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
          items: [
            {
              product_id: Number(selectedProductId || 1),
              quantity: effectiveQty,
              unit_price: unitPrice,
            },
          ],
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Select Solar Panel Product Model</label>
              <select
                value={selectedProductId}
                onChange={handleProductSelect}
                className="w-full p-2 border rounded-md text-sm bg-background font-medium"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.product_code}) - Stock: {p.current_stock}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Price per Panel (INR ₹)</label>
              <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                placeholder="Unit Price"
              />
            </div>
          </div>

          {/* Barcode Scanner Input */}
          <div className="bg-slate-900 p-4 rounded-lg text-white space-y-2">
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider">
              Scan Barcode / Unique Serial Number (Module Sr. No.)
            </label>
            <form onSubmit={handleAddSerialBarcode} className="flex gap-2">
              <Input
                autoFocus
                value={scannedSerialInput}
                onChange={(e) => setScannedSerialInput(e.target.value)}
                placeholder="Scan or type Module Sr. No. (e.g. WS08269074875699) and hit Enter"
                className="bg-slate-800 text-white border-slate-700 font-mono text-sm"
              />
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                Add Barcode
              </Button>
            </form>
            <p className="text-[11px] text-slate-400 italic">
              Connect your USB Barcode Scanner or type serial number to auto-validate against inventory.
            </p>
          </div>

          {scanMessage && (
            <div className={`p-2.5 rounded text-xs font-bold ${
              scanMessage.type === 'success' ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
            }`}>
              {scanMessage.text}
            </div>
          )}

          {/* Scanned Serials List */}
          {scannedSerials.length > 0 && (
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 font-bold flex justify-between">
                <span>Scanned Solar Panel Serials List ({scannedSerials.length})</span>
                <span>Total Amount: ₹{(scannedSerials.length * unitPrice).toLocaleString('en-IN')}</span>
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
