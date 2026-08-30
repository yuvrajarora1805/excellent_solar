'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'WORKER',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/users');
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to create user' });
      }
    } catch (error) {
      console.error('Failed to create user:', error);
      setErrors({ form: 'Failed to create user. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New User</h1>
          <p className="text-slate-600 dark:text-slate-400">Add a new user to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Enter the basic information for the new user</CardDescription>
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
                  <Label htmlFor="password">Temporary Password *</Label>
                  <Input
                    id="password" name="password" type="password" value={formData.password}
                    onChange={handleChange} placeholder="Enter a temporary password"
                    className={errors.password ? 'border-red-500' : ''} disabled={loading}
                  />
                  {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {loading ? 'Creating...' : 'Create User'}
              </Button>
              <Link href="/users">
                <Button type="button" variant="outline" disabled={loading}>Cancel</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
