'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    gstin: '',
  });

  useEffect(() => {
    fetchSupplier();
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setFetching(true);
      const res = await fetch(`/api/inventory/suppliers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          contact_person: data.contact_person || '',
          mobile: data.mobile || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          gstin: data.gstin || '',
        });
      } else {
        setErrors({ form: 'Supplier not found' });
      }
    } catch (err) {
      setErrors({ form: 'Failed to fetch supplier details' });
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Supplier name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/inventory/suppliers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/inventory/suppliers');
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to update supplier' });
      }
    } catch (error) {
      setErrors({ form: 'Failed to update supplier' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-12">Loading supplier details...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/inventory/suppliers">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Suppliers</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Supplier</h1>
          <p className="text-slate-600 dark:text-slate-400">Update supplier contact details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
            <CardDescription>Update supplier contact details and GSTIN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                {errors.form}
              </div>
            )}

            <div>
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input id="contact_person" name="contact_person" value={formData.contact_person} onChange={handleChange} disabled={loading} />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} disabled={loading} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} disabled={loading} />
              </div>
              <div>
                <Label htmlFor="gstin">GSTIN</Label>
                <Input id="gstin" name="gstin" value={formData.gstin} onChange={handleChange} disabled={loading} />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                disabled={loading}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} disabled={loading} />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" value={formData.state} onChange={handleChange} disabled={loading} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href="/inventory/suppliers">
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
