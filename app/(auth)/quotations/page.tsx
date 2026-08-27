'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { SolarQuotationTemplate, SolarQuotationData } from '@/components/quotations/solar-quotation-template';


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

function QuotationsPageContent() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const searchParams = useSearchParams();

  const initialProjectId = searchParams.get('project_id') || '';

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
          <p className="text-body-md text-on-surface-variant mt-1">Manage solar system quotations for customers using Excellent Solar pattern</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsOcrModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2">
            <span className="material-symbols-outlined">center_focus_weak</span>
            Import Quotation PDF (OCR)
          </Button>
          <Button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined">description</span>
            New Quotation
          </Button>
        </div>
      </div>

      {/* OCR Quotation Modal */}
      <Modal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        title="Import Quotation PDF (OCR & Pattern Generator)"
        size="lg"
      >
        <OcrQuotationImportModal
          onClose={() => setIsOcrModalOpen(false)}
          onSuccess={() => {
            setIsOcrModalOpen(false);
            fetchQuotations();
          }}
        />
      </Modal>


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
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Quotation">
        <CreateQuotationForm
          initialProjectId={initialProjectId}
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

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-on-surface-variant animate-pulse">Loading quotations...</div>}>
      <QuotationsPageContent />
    </Suspense>
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

      {/* Status & Actions */}
      <div className="flex items-center justify-between">
        <span className="status-badge bg-secondary-container text-on-secondary-container">{quotation.status}</span>
        <div className="flex gap-3 print-hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-primary font-label-bold rounded hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined">print</span>
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateQuotationForm({ onSuccess, onCancel, initialProjectId = '' }: any) {
  const [step, setStep] = useState<'select' | 'template' | 'custom'>('select');
  const [formData, setFormData] = useState({
    project_id: initialProjectId,
    system_template_id: '',
    quotation_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    discount_percentage: 0,
    terms_conditions: '',
  });

  const [templates, setTemplates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<any | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  useEffect(() => {
    // Fetch system templates
    fetch('/api/system-templates')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTemplates(data);
      })
      .catch((err) => console.error('Error fetching templates:', err));

    // Fetch projects for dropdown
    fetch('/api/projects?limit=1000') // fetch enough for a dropdown
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.projects)) setProjects(data.projects);
      })
      .catch((err) => console.error('Error fetching projects:', err));
  }, []);

  useEffect(() => {
    if (formData.system_template_id) {
      setIsLoadingPreview(true);
      fetch(`/api/system-templates/${formData.system_template_id}`)
        .then(res => res.json())
        .then(data => {
          setSelectedTemplatePreview(data);
        })
        .catch(err => console.error('Error fetching template preview:', err))
        .finally(() => setIsLoadingPreview(false));
    } else {
      setSelectedTemplatePreview(null);
    }
  }, [formData.system_template_id]);

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
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="input-base cursor-pointer"
              required
            >
              <option value="">Select a Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id_str} - {p.customer_name}
                </option>
              ))}
            </select>
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
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.capacity_kw} kW - {t.system_type})
                  </option>
                ))}
              </select>

              {/* Template Preview */}
              {isLoadingPreview && <div className="mt-2 text-sm text-on-surface-variant animate-pulse">Loading preview...</div>}
              {selectedTemplatePreview && selectedTemplatePreview.items && !isLoadingPreview && (
                <div className="mt-4 p-4 border border-outline-variant rounded bg-surface-container-lowest">
                  <h4 className="font-label-bold text-on-surface mb-2">Template Preview</h4>
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="py-2 px-2">Item</th>
                        <th className="py-2 px-2 text-right">Qty</th>
                        <th className="py-2 px-2 text-right">Unit Price</th>
                        <th className="py-2 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {selectedTemplatePreview.items.filter((i: any) => !i.is_optional).map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 px-2 font-medium">{item.product_name}</td>
                          <td className="py-2 px-2 text-right font-technical-mono">{item.quantity}</td>
                          <td className="py-2 px-2 text-right font-technical-mono">
                            ₹{(item.selling_price || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-right font-technical-mono text-primary-container font-bold">
                            ₹{((item.selling_price || 0) * item.quantity).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-outline-variant font-bold">
                      <tr>
                        <td colSpan={3} className="py-2 px-2 text-right">Estimated Subtotal:</td>
                        <td className="py-2 px-2 text-right text-primary-fixed font-technical-mono">
                          ₹{selectedTemplatePreview.items.filter((i: any) => !i.is_optional).reduce((sum: number, item: any) => sum + (item.quantity * (item.selling_price || 0)), 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
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

function OcrQuotationImportModal({ onClose }: { onClose: () => void; onSuccess: () => void }) {
  const [filePath, setFilePath] = useState('/media/yuvraj/New Volume/xamp/htdocs/excellent-solar/SOLAR ROOFTOP QUOTATION 200 KW_260827_183327.pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotationData, setQuotationData] = useState<SolarQuotationData | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'json'>('preview');

  const handleParse = async () => {
    try {
      setLoading(true);
      let response: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        response = await fetch('/api/ocr/parse-pdf', { method: 'POST', body: formData });
      } else {
        response = await fetch('/api/ocr/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });
      }

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to parse PDF');
      }

      setQuotationData(data);
    } catch (err: any) {
      alert(err.message || 'Error executing OCR on quotation PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {/* Upload or local path input */}
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border space-y-3">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Upload Quotation PDF or specify File Path
        </label>
        <div className="flex gap-2">
          <Input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
            }}
            className="flex-1"
          />
          <Button onClick={handleParse} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? 'Running OCR...' : 'Run OCR'}
          </Button>
        </div>
        <div className="text-xs text-slate-500">Local PDF file path:</div>
        <Input
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          placeholder="/path/to/quotation.pdf"
          className="text-xs font-mono"
        />
      </div>

      {/* OCR Parsed Result Header & Pattern Preview */}
      {quotationData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div>
              <span className="font-bold text-amber-900 block text-sm">PDF Quotation OCR Parsed Successfully</span>
              <span className="text-xs text-amber-700">Customer: {quotationData.customer_name} | Capacity: {quotationData.capacity}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'preview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('preview')}
              >
                Pattern Preview
              </Button>
              <Button
                variant={viewMode === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('json')}
              >
                Extracted Data
              </Button>
              <Button size="sm" onClick={() => window.print()} className="bg-blue-600 text-white">
                Print / Download PDF
              </Button>
            </div>
          </div>

          {viewMode === 'preview' ? (
            <div className="border rounded-lg p-2 bg-slate-100 overflow-x-auto">
              <SolarQuotationTemplate data={quotationData} />
            </div>
          ) : (
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">
              {JSON.stringify(quotationData, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

