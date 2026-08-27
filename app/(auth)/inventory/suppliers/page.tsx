'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft, Building2, Phone, Mail, MapPin } from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  status: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/suppliers');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/inventory">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Suppliers</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage vendor details and contact information</p>
          </div>
        </div>
        <Link href="/inventory/suppliers/new">
          <Button><Plus className="w-4 h-4 mr-2" />Add Supplier</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading suppliers...</div>
      ) : suppliers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium">No Suppliers Found</h3>
            <p className="text-slate-500 mb-4">Add your first supplier to start creating purchase invoices.</p>
            <Link href="/inventory/suppliers/new">
              <Button><Plus className="w-4 h-4 mr-2" />Add Supplier</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{supplier.name}</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    {supplier.status}
                  </span>
                </CardTitle>
                {supplier.contact_person && (
                  <p className="text-sm text-slate-500 font-medium">Contact: {supplier.contact_person}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {supplier.mobile && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{supplier.mobile}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {(supplier.city || supplier.state) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{[supplier.city, supplier.state].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {supplier.gstin && (
                  <div className="pt-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    GSTIN: <span className="font-mono">{supplier.gstin}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
