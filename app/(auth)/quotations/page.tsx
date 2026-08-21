'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface Quotation {
  id: number;
  quotation_number: string;
  project_id: number;
  project_id_str: string;
  customer_name: string;
  quotation_date: string;
  valid_until?: string;
  system_type?: string;
  capacity_kw?: number;
  total_amount: number;
  status: string;
  subtotal?: number;
  discount_amount?: number;
  discount_percentage?: number;
  gst_amount?: number;
  gst_percentage?: number;
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quotations');
      const data = await response.json();

      // Handle error responses
      if (response.status === 401) {
        console.warn('Unauthorized - quotations require authentication');
        setQuotations([]);
        return;
      }

      // Ensure data is an array
      if (Array.isArray(data)) {
        setQuotations(data);
      } else if (data?.error) {
        console.error('API Error:', data.error);
        setQuotations([]);
      } else {
        console.error('Unexpected data format:', data);
        setQuotations([]);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setQuotations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/quotations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchQuotations();
      setIsDetailsOpen(false);
    } catch (error) {
      console.error('Error updating quotation:', error);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'SENT': return 'info';
      case 'DRAFT': return 'warning';
      case 'REJECTED':
      case 'EXPIRED': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      key: 'quotation_number',
      title: 'Quotation #',
      render: (value: string) => (
        <span className="font-technical-mono text-sm font-medium">{value}</span>
      ),
    },
    {
      key: 'customer_name',
      title: 'Customer',
      render: (value: string, row: Quotation) => (
        <div>
          <div className="font-medium text-on-surface">{value}</div>
          <div className="text-xs text-on-surface-variant">ES-2026-{String(row.project_id).padStart(4, '0')}</div>
        </div>
      ),
    },
    {
      key: 'system_details',
      title: 'System',
      render: (_: any, row: Quotation) => (
        <span className="text-sm text-on-surface">
          {row.capacity_kw ? `${row.capacity_kw} kW` : '-'} {row.system_type?.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'quotation_date',
      title: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'valid_until',
      title: 'Valid Until',
      render: (value?: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      key: 'total_amount',
      title: 'Amount',
      render: (value: number) => (
        <span className="font-medium text-on-surface font-technical-mono">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value: string) => {
        const variant = getStatusVariant(value);
        const colors = {
          success: 'bg-tertiary-container text-on-tertiary-container',
          warning: 'bg-primary-fixed text-on-primary-fixed',
          error: 'bg-error-container text-on-error-container',
          info: 'bg-secondary-container text-on-secondary-container',
          default: 'bg-surface-container text-on-surface-variant',
        };
        return <span className={`status-badge ${colors[variant]}`}>{value}</span>;
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (_: any, row: Quotation) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedQuotation(row);
              setIsDetailsOpen(true);
            }}
            className="p-1 hover:bg-surface-container-low rounded transition-colors"
            title="View Details"
          >
            <span className="material-symbols-outlined text-sm text-on-surface-variant">visibility</span>
          </button>
          {row.status === 'DRAFT' && (
            <button
              onClick={() => handleUpdateStatus(row.id, 'SENT')}
              className="p-1 hover:bg-surface-container-low rounded transition-colors"
              title="Send Quotation"
            >
              <span className="material-symbols-outlined text-sm text-secondary">send</span>
            </button>
          )}
          {row.status === 'SENT' && (
            <>
              <button
                onClick={() => handleUpdateStatus(row.id, 'ACCEPTED')}
                className="p-1 hover:bg-tertiary-container rounded transition-colors"
                title="Mark as Accepted"
              >
                <span className="material-symbols-outlined text-sm text-tertiary">check</span>
              </button>
              <button
                onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
                className="p-1 hover:bg-error-container rounded transition-colors"
                title="Mark as Rejected"
              >
                <span className="material-symbols-outlined text-sm text-error">close</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Quotations</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage solar system quotations for customers</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">description</span>
          New Quotation
        </Button>
      </div>

      {/* Data Table */}
      <div className="card-base overflow-hidden">
        <DataTable
          columns={columns}
          data={quotations}
          isLoading={isLoading}
          emptyMessage="No quotations found. Create your first quotation to get started."
        />
      </div>

      {/* View Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={`Quotation ${selectedQuotation?.quotation_number}`}
        size="lg"
      >
        {selectedQuotation && (
          <QuotationDetails
            quotation={selectedQuotation}
            onClose={() => setIsDetailsOpen(false)}
          />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Quotation"
        size="lg"
      >
        <CreateQuotationForm
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchQuotations();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}

function QuotationDetails({ quotation, onClose }: any) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-surface-container-low rounded">
        <div>
          <div className="text-sm text-on-surface-variant">Customer</div>
          <div className="font-medium text-on-surface">{quotation.customer_name}</div>
        </div>
        <div>
          <div className="text-sm text-on-surface-variant">Project</div>
          <div className="font-medium text-on-surface">ES-2026-{String(quotation.project_id).padStart(4, '0')}</div>
        </div>
        <div>
          <div className="text-sm text-on-surface-variant">System</div>
          <div className="font-medium text-on-surface">{quotation.capacity_kw} kW {quotation.system_type?.replace('_', ' ')}</div>
        </div>
        <div>
          <div className="text-sm text-on-surface-variant">Valid Until</div>
          <div className="font-medium text-on-surface">{quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : '-'}</div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-2 p-4 border border-outline-variant rounded">
        <div className="flex justify-between">
          <span className="text-on-surface-variant">Subtotal</span>
          <span className="font-medium font-technical-mono">{formatCurrency(quotation.subtotal || 0)}</span>
        </div>
        {quotation.discount_amount > 0 && (
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Discount ({quotation.discount_percentage}%)</span>
            <span className="font-medium text-tertiary font-technical-mono">-{formatCurrency(quotation.discount_amount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-on-surface-variant">GST ({quotation.gst_percentage}%)</span>
          <span className="font-medium font-technical-mono">{formatCurrency(quotation.gst_amount || 0)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-outline-variant">
          <span className="font-semibold text-on-surface">Total</span>
          <span className="font-bold text-lg text-primary-container font-technical-mono">{formatCurrency(quotation.total_amount)}</span>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className="status-badge bg-secondary-container text-on-secondary-container">{quotation.status}</span>
        <button
          onClick={onClose}
          className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function CreateQuotationForm({ onSuccess, onCancel }: any) {
  const [step, setStep] = useState<'select' | 'template' | 'custom'>('select');
  const [formData, setFormData] = useState({
    project_id: '',
    system_template_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    discount_percentage: 0,
    terms_conditions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating quotation:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-on-surface-variant">How would you like to create the quotation?</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setStep('template')}
              className="p-4 border border-outline-variant rounded hover:border-primary-container transition-colors text-left"
            >
              <div className="font-medium text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">description</span>
                From Template
              </div>
              <div className="text-sm text-on-surface-variant">Use a pre-configured system template</div>
            </button>
            <button
              type="button"
              onClick={() => setStep('custom')}
              className="p-4 border border-outline-variant rounded hover:border-primary-container transition-colors text-left"
            >
              <div className="font-medium text-on-surface mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">edit_note</span>
                Custom Quote
              </div>
              <div className="text-sm text-on-surface-variant">Build a custom quotation from scratch</div>
            </button>
          </div>
        </div>
      )}

      {(step === 'template' || step === 'custom') && (
        <>
          <div>
            <label className="block text-label-bold text-on-surface mb-1">
              Project
            </label>
            <input
              type="number"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              placeholder="Enter Project ID"
              className="input-base"
              required
            />
          </div>

          {step === 'template' && (
            <div>
              <label className="block text-label-bold text-on-surface mb-1">
                System Template
              </label>
              <select
                value={formData.system_template_id}
                onChange={(e) => setFormData({ ...formData, system_template_id: e.target.value })}
                className="input-base cursor-pointer"
                required
              >
                <option value="">Select a template</option>
                <option value="1">3 kW On-Grid - Standard</option>
                <option value="2">5 kW On-Grid - Standard</option>
                <option value="3">5 kW On-Grid - Premium</option>
                <option value="4">10 kW On-Grid - Standard</option>
                <option value="5">5 kW Hybrid - Standard</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-bold text-on-surface mb-1">
                Quotation Date
              </label>
              <input
                type="date"
                value={formData.quotation_date}
                onChange={(e) => setFormData({ ...formData, quotation_date: e.target.value })}
                className="input-base"
                required
              />
            </div>
            <div>
              <label className="block text-label-bold text-on-surface mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-label-bold text-on-surface mb-1">
              Discount Percentage
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
              className="input-base"
            />
          </div>
        </>
      )}

      <div className="flex justify-between pt-4 border-t border-outline-variant">
        {step !== 'select' && (
          <button
            type="button"
            onClick={() => setStep('select')}
            className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors"
          >
            Back
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors"
          >
            Cancel
          </button>
          {step !== 'select' && (
            <button
              type="submit"
              className="btn-primary"
            >
              Create Quotation
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
