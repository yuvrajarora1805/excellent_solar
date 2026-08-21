'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProjectInventorySelector, { type ReservationItem } from '@/components/ui/ProjectInventorySelector';

interface Customer {
  id: number;
  name: string;
  mobile: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingCustomers, setFetchingCustomers] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);

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
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setFetchingCustomers(true);
      const response = await fetch('/api/customers?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setFetchingCustomers(false);
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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
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
        const project = await response.json();
        // Create inventory reservations if any items selected
        if (reservations.length > 0) {
          await fetch(`/api/projects/${project.id}/reservations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: reservations.map(r => ({ product_id: r.product_id, quantity: r.quantity })),
              reserved_by: 1,
            }),
          });
        }
        router.push(`/projects/${project.id}`);
      } else {
        const error = await response.json();
        setErrors({ form: error.error || 'Failed to create project' });
        setStep(1);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ form: 'Failed to create project. Please try again.' });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => step === 2 ? setStep(1) : router.push('/projects')}
          className="btn-outline flex h-10 w-10 shrink-0 items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-md font-bold text-on-surface">New Project</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">Create a new solar installation project</p>
        </div>
        {/* Step Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            step === 1 ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container'
          }`}>
            <span className="material-symbols-outlined text-sm">{step === 1 ? 'edit_note' : 'check_circle'}</span>
            Step 1: Details
          </div>
          <span className="text-on-surface-variant">→</span>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            step === 2 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'
          }`}>
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Step 2: Inventory
          </div>
        </div>
      </div>

      {/* =================================================
          FORM CARD
      ================================================== */}
      {/* ===== STEP 1: Project Details ===== */}
      {step === 1 && <form onSubmit={handleNextStep}>
        <div className="card-base p-6 sm:p-8">
          {errors.form && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
              {errors.form}
            </div>
          )}

          {/* =================================================
              CUSTOMER SELECTION
          ================================================== */}
          <section className="mb-8">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              Customer Information
            </h2>

            <div className="min-w-0">
              <label
                htmlFor="customer_id"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Select Customer
              </label>

              <select
                id="customer_id"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="input-base"
                disabled={loading || fetchingCustomers}
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

          {/* =================================================
              DISCOM INFORMATION
          ================================================== */}
          <section className="mb-8 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              DISCOM Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Account Number */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="account_number"
                  className="block text-sm font-semibold text-gray-700"
                >
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

              {/* Consumer Number */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="consumer_number"
                  className="block text-sm font-semibold text-gray-700"
                >
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

              {/* DISCOM */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="discom"
                  className="block text-sm font-semibold text-gray-700"
                >
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

              {/* Subdivision */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="subdivision"
                  className="block text-sm font-semibold text-gray-700"
                >
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

              {/* Division */}
              <div className="min-w-0 space-y-2 sm:col-span-2">
                <label
                  htmlFor="division"
                  className="block text-sm font-semibold text-gray-700"
                >
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

          {/* =================================================
              LOAD INFORMATION
          ================================================== */}
          <section className="mb-8 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              Load Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Sanctioned Load */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="sanctioned_load"
                  className="block text-sm font-semibold text-gray-700"
                >
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

              {/* Solar Load */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="solar_load"
                  className="block text-sm font-semibold text-gray-700"
                >
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

          {/* =================================================
              SITE INFORMATION
          ================================================== */}
          <section className="mb-8 border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-headline-sm font-semibold text-gray-900">
              Site Information
            </h2>

            <div className="space-y-4">
              {/* Site Address */}
              <div className="min-w-0 space-y-2">
                <label
                  htmlFor="site_address"
                  className="block text-sm font-semibold text-gray-700"
                >
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
                {/* Capacity */}
                <div className="min-w-0 space-y-2">
                  <label
                    htmlFor="capacity"
                    className="block text-sm font-semibold text-gray-700"
                  >
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

                {/* Latitude */}
                <div className="min-w-0 space-y-2">
                  <label
                    htmlFor="latitude"
                    className="block text-sm font-semibold text-gray-700"
                  >
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

                {/* Longitude */}
                <div className="min-w-0 space-y-2">
                  <label
                    htmlFor="longitude"
                    className="block text-sm font-semibold text-gray-700"
                  >
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

          {/* =================================================
              FORM ACTIONS
          {/* Actions */}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-outline-variant pt-6 sm:flex-row sm:justify-end">
            <Link href="/projects" className="btn-outline h-10 w-full sm:w-auto">Cancel</Link>
            <button type="submit" className="btn-primary h-10 w-full sm:w-auto flex items-center gap-2 justify-center">
              Next: Select Inventory
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </form>}

      {/* ===== STEP 2: Inventory Reservation ===== */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="card-base p-6">
            <h2 className="text-title-md font-semibold text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-container">inventory_2</span>
              Reserve Inventory Items
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              Select products from inventory to reserve for this project. Reserved stock cannot be allocated to other projects.
            </p>
            <ProjectInventorySelector value={reservations} onChange={setReservations} />
          </div>

          {/* Step 2 Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setStep(1)} className="btn-outline h-10 w-full sm:w-auto">
              ← Back to Details
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary h-10 w-full sm:w-auto flex items-center gap-2 justify-center disabled:opacity-50"
            >
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Creating...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">check_circle</span>
                  Create Project {reservations.length > 0 ? `+ Reserve ${reservations.length} Items` : '(No Inventory)'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
