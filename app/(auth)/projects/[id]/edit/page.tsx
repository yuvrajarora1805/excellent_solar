'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Customer {
  id: number;
  name: string;
  mobile: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    account_number: '',
    consumer_number: '',
    discom: '',
    subdivision: '',
    division: '',
    sanctioned_load: '',
    solar_load: '',
    site_address: '',
    latitude: '',
    longitude: '',
    capacity: '',
  });

  useEffect(() => {
    if (id) {
      fetchInitialData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    try {
      setFetchingData(true);
      const [custRes, projRes] = await Promise.all([
        fetch('/api/customers?limit=1000'),
        fetch(`/api/projects/${id}`)
      ]);
      
      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.customers || []);
      }
      
      if (projRes.ok) {
        const project = await projRes.json();
        setFormData({
          customer_id: project.customer_id?.toString() || '',
          account_number: project.account_number || '',
          consumer_number: project.consumer_number || '',
          discom: project.discom || '',
          subdivision: project.subdivision || '',
          division: project.division || '',
          sanctioned_load: project.sanctioned_load?.toString() || '',
          solar_load: project.solar_load?.toString() || '',
          site_address: project.site_address || '',
          latitude: project.latitude?.toString() || '',
          longitude: project.longitude?.toString() || '',
          capacity: project.capacity?.toString() || '',
        });
      } else {
        setErrors({ form: 'Project not found.' });
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      setErrors({ form: 'Failed to load project details.' });
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Please select a customer';
    }
    if (formData.capacity && (isNaN(parseFloat(formData.capacity)) || parseFloat(formData.capacity) <= 0)) {
      newErrors.capacity = 'Invalid capacity value';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customer_id: parseInt(formData.customer_id),
          sanctioned_load: formData.sanctioned_load ? parseFloat(formData.sanctioned_load) : null,
          solar_load: formData.solar_load ? parseFloat(formData.solar_load) : null,
          capacity: formData.capacity ? parseFloat(formData.capacity) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      if (response.ok) {
        router.push(`/projects/${id}`);
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to update project' });
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      setErrors({ form: 'Failed to update project. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return <div className="p-8 text-center text-on-surface">Loading project details...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push(`/projects/${id}`)}
          className="btn-outline flex h-10 w-10 shrink-0 items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-md font-bold text-on-surface">Edit Project #{id}</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Update project details</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="card-base p-6 sm:p-8">
          {errors.form && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {errors.form}
            </div>
          )}

          <section className="mb-8">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              Customer Information
            </h2>
            <div className="min-w-0">
              <label htmlFor="customer_id" className="mb-2 block text-sm font-semibold text-gray-700">
                Select Customer
              </label>
              <select
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="input-base"
                disabled={loading}
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.mobile}
                  </option>
                ))}
              </select>
              {errors.customer_id && (
                <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>
              )}
            </div>
          </section>

          <section className="mb-8 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              DISCOM Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <label htmlFor="account_number" className="block text-sm font-semibold text-gray-700">
                  Account Number
                </label>
                <input
                  id="account_number"
                  name="account_number"
                  type="text"
                  placeholder="Consumer account number"
                  value={formData.account_number}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="consumer_number" className="block text-sm font-semibold text-gray-700">
                  Consumer Number
                </label>
                <input
                  id="consumer_number"
                  name="consumer_number"
                  type="text"
                  placeholder="Consumer number"
                  value={formData.consumer_number}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="discom" className="block text-sm font-semibold text-gray-700">
                  DISCOM
                </label>
                <input
                  id="discom"
                  name="discom"
                  type="text"
                  placeholder="Electricity distribution company"
                  value={formData.discom}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="subdivision" className="block text-sm font-semibold text-gray-700">
                  Subdivision
                </label>
                <input
                  id="subdivision"
                  name="subdivision"
                  type="text"
                  placeholder="Subdivision"
                  value={formData.subdivision}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              <div className="min-w-0 space-y-2 sm:col-span-2">
                <label htmlFor="division" className="block text-sm font-semibold text-gray-700">
                  Division
                </label>
                <input
                  id="division"
                  name="division"
                  type="text"
                  placeholder="Division"
                  value={formData.division}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          <section className="mb-8 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              Load Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <label htmlFor="sanctioned_load" className="block text-sm font-semibold text-gray-700">
                  Sanctioned Load (kW)
                </label>
                <input
                  id="sanctioned_load"
                  name="sanctioned_load"
                  type="number"
                  step="0.01"
                  placeholder="Sanctioned load in kW"
                  value={formData.sanctioned_load}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="solar_load" className="block text-sm font-semibold text-gray-700">
                  Solar Load (kW)
                </label>
                <input
                  id="solar_load"
                  name="solar_load"
                  type="number"
                  step="0.01"
                  placeholder="Solar load in kW"
                  value={formData.solar_load}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          <section className="mb-8 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              Site Information
            </h2>
            <div className="space-y-4">
              <div className="min-w-0 space-y-2">
                <label htmlFor="site_address" className="block text-sm font-semibold text-gray-700">
                  Site Address
                </label>
                <input
                  id="site_address"
                  name="site_address"
                  type="text"
                  placeholder="Installation site address"
                  value={formData.site_address}
                  onChange={handleChange}
                  className="input-base"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="min-w-0 space-y-2">
                  <label htmlFor="capacity" className="block text-sm font-semibold text-gray-700">
                    Planned Capacity (kW)
                  </label>
                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    step="0.01"
                    placeholder="e.g., 5.0"
                    value={formData.capacity}
                    onChange={handleChange}
                    className={`input-base ${errors.capacity ? 'border-red-500' : ''}`}
                    disabled={loading}
                  />
                  {errors.capacity && (
                    <p className="text-sm text-red-600">{errors.capacity}</p>
                  )}
                </div>

                <div className="min-w-0 space-y-2">
                  <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 28.6139"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="input-base"
                    disabled={loading}
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="0.000001"
                    placeholder="e.g., 77.2090"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="input-base"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline-variant pt-6 sm:flex-row sm:justify-end">
            <Link href={`/projects/${id}`} className="btn-outline h-10 w-full sm:w-auto">Cancel</Link>
            <button type="submit" disabled={loading} className="btn-primary h-10 w-full sm:w-auto flex items-center gap-2 justify-center">
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Saving...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">save</span> Save Changes</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
