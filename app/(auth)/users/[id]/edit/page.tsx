'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'WORKER',
    password: '',
    active: true,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${id}`);
        if (res.ok) {
          const user = await res.json();
          setFormData({
            name: user.name || '',
            email: user.email || '',
            mobile: user.mobile || '',
            role: user.role || 'WORKER',
            password: '', // Leave blank, only update if entered
            active: user.active === 1 || user.active === true,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };
    if (id) fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/users');
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to update user' });
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      setErrors({ form: 'Failed to update user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit User</h1>
          <p className="text-slate-600 dark:text-slate-400">Update system user details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Update the information for this user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errors.form && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                {errors.form}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Enter full name"
                  className={errors.name ? 'border-red-500' : ''} disabled={loading}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email" name="email" type="email" value={formData.email}
                    onChange={handleChange} placeholder="user@company.com"
                    className={errors.email ? 'border-red-500' : ''} disabled={loading}
                  />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile" name="mobile" type="tel" value={formData.mobile}
                    onChange={handleChange} placeholder="10-digit number"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="role">System Role *</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="ORDER_MANAGER">Order & Dispatch Manager</option>
                    <option value="MARKETING">Marketing / Sales</option>
                    <option value="INSTALLATION">Installation</option>
                    <option value="DISCOM">DISCOM</option>
                    <option value="SURVEY_VIEWER">Site Survey & Installation Viewer</option>

                  </select>
                </div>
                <div>
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password" name="password" type="password" value={formData.password}
                    onChange={handleChange} placeholder="Leave blank to keep unchanged"
                    className={errors.password ? 'border-red-500' : ''} disabled={loading}
                  />
                  {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 text-primary rounded border-gray-300"
                />
                <Label htmlFor="active" className="cursor-pointer font-medium">Account is Active</Label>
              </div>

            </div>

            <div className="pt-4 flex justify-end gap-3 border-t mt-6">
              <Link href="/users">
                <Button variant="outline" type="button" disabled={loading}>Cancel</Button>
              </Link>
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
