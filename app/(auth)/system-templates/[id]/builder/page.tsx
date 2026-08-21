'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/ui/data-table';
import { ArrowLeft, Plus, Save, Trash2, Edit } from 'lucide-react';

export default function SystemTemplateBuilderPage() {
  const { id } = useParams();
  const router = useRouter();

  const [template, setTemplate] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Item form
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [templateRes, productsRes] = await Promise.all([
        fetch(`/api/system-templates/${id}`),
        fetch('/api/inventory/products')
      ]);
      
      if (!templateRes.ok) throw new Error('Template not found');
      
      const templateData = await templateRes.json();
      const productsData = await productsRes.json();
      
      setTemplate(templateData);
      setProducts(productsData.data || productsData); // handle pagination if any
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      // For simplicity, we PUT to a new endpoint or update items.
      // Wait, there is no endpoint to update items yet. We will need to create one.
      // We will send a POST to `/api/system-templates/${id}/items`
      await fetch(`/api/system-templates/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: parseInt(selectedProduct),
          quantity: quantity
        })
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Remove this item?')) return;
    try {
      await fetch(`/api/system-templates/${id}/items/${itemId}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading builder...</div>;
  if (!template) return <div className="p-8 text-center">Template not found</div>;

  const totalCost = template.items?.reduce((acc: number, item: any) => {
    return acc + (parseFloat(item.product?.selling_price || 0) * item.quantity);
  }, 0) || 0;

  const columns = [
    {
      key: 'product',
      title: 'Product',
      render: (_: any, row: any) => (
        <div>
          <div className="font-medium">{row.product?.name || 'Unknown Product'}</div>
          <div className="text-xs text-slate-500">{row.product?.product_code}</div>
        </div>
      )
    },
    {
      key: 'price',
      title: 'Unit Price',
      render: (_: any, row: any) => `₹${row.product?.selling_price || 0}`
    },
    {
      key: 'quantity',
      title: 'Qty',
      render: (value: number) => value
    },
    {
      key: 'total',
      title: 'Total',
      render: (_: any, row: any) => `₹${(parseFloat(row.product?.selling_price || 0) * row.quantity).toFixed(2)}`
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: any) => (
        <button
          onClick={() => handleDeleteItem(row.id)}
          className="p-1 hover:bg-red-50 text-red-500 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/system-templates">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Template Builder: {template.name}</h1>
          <p className="text-slate-600">Add products and configure pricing</p>
        </div>
        <div className="ml-auto text-xl font-bold text-orange-600">
          Total Cost: ₹{totalCost.toFixed(2)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200">
        <div className="flex justify-between p-4 border-b">
          <h3 className="font-bold">Template Items</h3>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>
        <div className="p-4">
          <DataTable 
            columns={columns} 
            data={template.items || []} 
            isLoading={false}
            emptyMessage="No items in this template yet."
          />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Product to Template">
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select Product</label>
            <select 
              className="w-full p-2 border rounded"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              required
            >
              <option value="">Select a product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.product_code}) - ₹{p.selling_price || 0}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <Input 
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Item</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
