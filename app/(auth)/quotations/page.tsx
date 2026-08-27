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
  items?: any[];
  terms_conditions?: string;
  remarks?: string;
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

  useEffect(() => { fetchQuotations(); }, []);

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quotations');
      const data = await response.json();
      if (Array.isArray(data)) setQuotations(data);
      else setQuotations([]);
    } catch { setQuotations([]); } finally { setIsLoading(false); }
  };

  const handleViewDetails = async (row: Quotation) => {
    try {
      const res = await fetch(`/api/quotations/${row.id}`);
      const data = await res.json();
      setSelectedQuotation(data || row);
    } catch { setSelectedQuotation(row); }
    setIsDetailsOpen(true);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/quotations/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchQuotations();
      setIsDetailsOpen(false);
    } catch (e) { console.error(e); }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const statusColors: Record<string, string> = {
    ACCEPTED: 'bg-tertiary-container text-on-tertiary-container',
    SENT: 'bg-secondary-container text-on-secondary-container',
    DRAFT: 'bg-primary-fixed text-on-primary-fixed',
    REJECTED: 'bg-error-container text-on-error-container',
    EXPIRED: 'bg-error-container text-on-error-container',
  };

  const columns = [
    { key: 'quotation_number', title: 'Quotation #', render: (v: string) => <span className="font-technical-mono text-sm font-medium">{v}</span> },
    {
      key: 'customer_name', title: 'Customer',
      render: (v: string, row: Quotation) => (
        <div>
          <div className="font-medium text-on-surface">{v}</div>
          <div className="text-xs text-on-surface-variant">ES-2026-{String(row.project_id).padStart(4, '0')}</div>
        </div>
      ),
    },
    {
      key: 'system_details', title: 'System',
      render: (_: any, row: Quotation) => (
        <span className="text-sm text-on-surface">{row.capacity_kw ? `${row.capacity_kw} kW` : '-'} {row.system_type?.replace(/_/g, ' ')}</span>
      ),
    },
    { key: 'quotation_date', title: 'Date', render: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'valid_until', title: 'Valid Until', render: (v?: string) => v ? new Date(v).toLocaleDateString() : '-' },
    {
      key: 'total_amount', title: 'Amount',
      render: (v: number) => <span className="font-medium font-technical-mono">{formatCurrency(v)}</span>,
    },
    {
      key: 'status', title: 'Status',
      render: (v: string) => <span className={`status-badge ${statusColors[v] || 'bg-surface-container text-on-surface-variant'}`}>{v}</span>,
    },
    {
      key: 'actions', title: 'Actions',
      render: (_: any, row: Quotation) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleViewDetails(row)} className="p-1 hover:bg-surface-container-low rounded" title="View & Print">
            <span className="material-symbols-outlined text-sm text-on-surface-variant">visibility</span>
          </button>
          {row.status === 'DRAFT' && (
            <button onClick={() => handleUpdateStatus(row.id, 'SENT')} className="p-1 hover:bg-surface-container-low rounded" title="Send">
              <span className="material-symbols-outlined text-sm text-secondary">send</span>
            </button>
          )}
          {row.status === 'SENT' && (
            <>
              <button onClick={() => handleUpdateStatus(row.id, 'ACCEPTED')} className="p-1 hover:bg-tertiary-container rounded" title="Accept">
                <span className="material-symbols-outlined text-sm text-tertiary">check</span>
              </button>
              <button onClick={() => handleUpdateStatus(row.id, 'REJECTED')} className="p-1 hover:bg-error-container rounded" title="Reject">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">Quotations</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage solar system quotations — Excellent Solar official pattern</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined">description</span>
          New Quotation
        </Button>
      </div>

      <Modal isOpen={isOcrModalOpen} onClose={() => setIsOcrModalOpen(false)} title="Import Quotation PDF" size="lg">
        <OcrQuotationImportModal onClose={() => setIsOcrModalOpen(false)} onSuccess={() => { setIsOcrModalOpen(false); fetchQuotations(); }} />
      </Modal>

      <div className="card-base overflow-hidden">
        <DataTable columns={columns} data={quotations} isLoading={isLoading} emptyMessage="No quotations found. Create your first quotation." />
      </div>

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title={`Quotation ${selectedQuotation?.quotation_number}`} size="lg">
        {selectedQuotation && (
          <QuotationDetails quotation={selectedQuotation} onClose={() => setIsDetailsOpen(false)} onUpdateStatus={handleUpdateStatus} />
        )}
      </Modal>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Quotation" size="lg">
        <CreateQuotationForm
          initialProjectId={initialProjectId}
          onSuccess={() => { setIsCreateOpen(false); fetchQuotations(); }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse">Loading quotations...</div>}>
      <QuotationsPageContent />
    </Suspense>
  );
}

// ─── QuotationDetails: renders Excellent Solar PDF template ───
function QuotationDetails({ quotation, onClose, onUpdateStatus }: any) {
  const items = Array.isArray(quotation.items) ? quotation.items : [];

  const materials = items.length > 0
    ? items.map((item: any, idx: number) => ({
        sr_no: idx + 1,
        material: (item.description || item.product_name || '').toUpperCase(),
        quantity: String(item.quantity || ''),
        brand: item.unit || '',
        description: item.unit_price > 0 ? `₹${Number(item.unit_price).toLocaleString('en-IN')}` : '',
      }))
    : undefined;

  const capacityKw = Number(quotation.capacity_kw || 0);
  const totalAmount = Number(quotation.total_amount || 0);
  const totalCost = totalAmount > 0
    ? `${(totalAmount / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh/-`
    : '';
  const ratePerWatt = capacityKw > 0 && totalAmount > 0
    ? `${(totalAmount / (capacityKw * 1000)).toFixed(2)}/-`
    : '';

  const terms = quotation.terms_conditions
    ? quotation.terms_conditions.split('\n').filter(Boolean)
    : undefined;

  const solarData: Partial<SolarQuotationData> = {
    customer_name: quotation.customer_name || '',
    date: quotation.quotation_date ? new Date(quotation.quotation_date).toLocaleDateString('en-IN') : '',
    project_type: (quotation.system_type || 'ONGRID_SOLAR').replace(/_/g, ' '),
    capacity: capacityKw ? `${capacityKw} KW` : '',
    location: quotation.remarks || '',
    materials,
    rate_per_watt: ratePerWatt,
    total_cost: totalCost,
    gst_info: quotation.gst_percentage ? `GST EXTRA ${quotation.gst_percentage}%` : 'GST EXTRA 8.9%',
    terms,
  };

  return (
    <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
      <div className="flex items-center justify-between print:hidden gap-2 pb-3 border-b border-outline-variant">
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
          quotation.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
          quotation.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
          quotation.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }`}>{quotation.status}</span>
        <div className="flex gap-2">
          {quotation.status === 'DRAFT' && (
            <Button size="sm" onClick={() => onUpdateStatus(quotation.id, 'SENT')} className="bg-blue-600 text-white">Mark as Sent</Button>
          )}
          {quotation.status === 'SENT' && (
            <>
              <Button size="sm" onClick={() => onUpdateStatus(quotation.id, 'ACCEPTED')} className="bg-green-600 text-white">Accept</Button>
              <Button size="sm" onClick={() => onUpdateStatus(quotation.id, 'REJECTED')} className="bg-red-600 text-white">Reject</Button>
            </>
          )}
          <Button size="sm" onClick={() => window.print()} className="flex items-center gap-1 bg-slate-800 text-white">
            <span className="material-symbols-outlined text-sm">print</span> Download PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
      <div className="border rounded overflow-x-auto bg-white">
        <SolarQuotationTemplate data={solarData} />
      </div>
    </div>
  );
}

// ─── CreateQuotationForm ───
interface LineItem {
  description: string; quantity: number; brand: string; unit: string;
  unit_price: number; line_total: number; sort_order: number;
}

function CreateQuotationForm({ onSuccess, onCancel, initialProjectId = '' }: any) {
  const [step, setStep] = useState<'select' | 'template' | 'custom'>('select');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [projectId, setProjectId] = useState(initialProjectId);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [gstPct, setGstPct] = useState(8.9);
  const [systemType, setSystemType] = useState('ONGRID_SOLAR');
  const [capacityKw, setCapacityKw] = useState('');
  const [location, setLocation] = useState('');
  const [termsConditions, setTermsConditions] = useState(
    '1. Validity: This quotation is valid for 15 days from the date of issue.\n2. Payment Terms: 30% advance, 65% on delivery, 5% on completion\n3. Maintenance: 1 Year, Maintenance (without panel washing) included.'
  );
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatePreview, setTemplatePreview] = useState<any | null>(null);
  const [items, setItems] = useState<LineItem[]>([
    { description: 'SOLAR PANELS', quantity: 1, brand: 'WAAREE TOPCON', unit: 'Piece', unit_price: 0, line_total: 0, sort_order: 1 },
  ]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/system-templates').then(r => r.json()).then(d => { if (Array.isArray(d)) setTemplates(d); }).catch(() => {});
    fetch('/api/projects?limit=1000').then(r => r.json()).then(d => { if (d?.projects) setProjects(d.projects); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (templateId) {
      fetch(`/api/system-templates/${templateId}`).then(r => r.json()).then(d => setTemplatePreview(d)).catch(() => {});
    } else setTemplatePreview(null);
  }, [templateId]);

  const addItem = () => setItems(prev => [
    ...prev, { description: '', quantity: 1, brand: '', unit: 'Piece', unit_price: 0, line_total: 0, sort_order: prev.length + 1 },
  ]);

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      updated.line_total = Number(updated.quantity || 0) * Number(updated.unit_price || 0);
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const discountAmt = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmt;
  const gstAmt = afterDiscount * (gstPct / 100);
  const totalAmount = afterDiscount + gstAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) { setError('Please select a project.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload: any = {
        project_id: Number(projectId),
        quotation_date: quotationDate,
        valid_until: validUntil || undefined,
        discount_percentage: discountPct,
        gst_percentage: gstPct,
        system_type: systemType,
        capacity_kw: capacityKw ? Number(capacityKw) : null,
        terms_conditions: termsConditions,
        remarks: location,
        status: 'DRAFT',
      };

      if (step === 'template' && templateId) {
        payload.system_template_id = Number(templateId);
      } else {
        payload.items = items.map((item, i) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'Piece',
          unit_price: item.unit_price,
          line_total: item.line_total,
          discount_amount: 0, tax_amount: 0, sort_order: i + 1,
        }));
        payload.subtotal = subtotal;
        payload.discount_amount = discountAmt;
        payload.gst_amount = gstAmt;
        payload.total_amount = totalAmount;
      }

      const res = await fetch('/api/quotations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create quotation');
    } finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      {error && <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">{error}</div>}

      {step === 'select' && (
        <div className="space-y-4">
          <p className="text-on-surface-variant">How would you like to create the quotation?</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'From Template', icon: 'description', desc: 'Use a pre-configured system template', s: 'template' as const },
              { label: 'Custom Quote', icon: 'edit_note', desc: 'Build a custom quotation from scratch', s: 'custom' as const },
            ].map(opt => (
              <button key={opt.s} type="button" onClick={() => setStep(opt.s)}
                className="p-4 border border-outline-variant rounded hover:border-primary-container transition-colors text-left">
                <div className="font-medium text-on-surface mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">{opt.icon}</span>{opt.label}
                </div>
                <div className="text-sm text-on-surface-variant">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(step === 'template' || step === 'custom') && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-bold text-on-surface mb-1">Project *</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className="input-base cursor-pointer" required>
                <option value="">Select a Project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.id_str} - {p.customer_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-label-bold text-on-surface mb-1">Quotation Date *</label>
              <input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="input-base" required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-label-bold text-on-surface mb-1">Valid Until</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="input-base" />
            </div>
            <div>
              <label className="block text-label-bold text-on-surface mb-1">System Type</label>
              <select value={systemType} onChange={e => setSystemType(e.target.value)} className="input-base cursor-pointer">
                <option value="ONGRID_SOLAR">Ongrid Solar</option>
                <option value="OFFGRID_SOLAR">Offgrid Solar</option>
                <option value="HYBRID_SOLAR">Hybrid Solar</option>
              </select>
            </div>
            <div>
              <label className="block text-label-bold text-on-surface mb-1">Capacity (kW)</label>
              <input type="number" value={capacityKw} onChange={e => setCapacityKw(e.target.value)} className="input-base" placeholder="e.g. 200" />
            </div>
          </div>

          <div>
            <label className="block text-label-bold text-on-surface mb-1">Location / Site</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="input-base" placeholder="e.g. JALALABAD" />
          </div>

          {step === 'template' && (
            <div>
              <label className="block text-label-bold text-on-surface mb-1">System Template *</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="input-base cursor-pointer" required>
                <option value="">Select a template</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.capacity_kw} kW - {t.system_type})</option>)}
              </select>
              {templatePreview?.items && (
                <div className="mt-3 p-3 border border-outline-variant rounded bg-surface-container-lowest text-xs">
                  <div className="font-bold mb-2">Template Items</div>
                  {templatePreview.items.filter((i: any) => !i.is_optional).map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-outline-variant">
                      <span>{item.product_name}</span>
                      <span className="font-technical-mono">x{item.quantity} @ ₹{(item.selling_price || 0).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-label-bold text-on-surface">Material / Line Items</label>
                <button type="button" onClick={addItem}
                  className="text-xs text-primary-container border border-primary-container px-2 py-1 rounded hover:bg-primary-fixed transition-colors">
                  + Add Row
                </button>
              </div>
              <div className="overflow-x-auto border border-outline-variant rounded">
                <table className="w-full text-xs">
                  <thead className="bg-surface-container-low text-on-surface-variant uppercase">
                    <tr>
                      <th className="p-2 text-left">Material</th>
                      <th className="p-2 text-left">Brand</th>
                      <th className="p-2 text-center w-16">Qty</th>
                      <th className="p-2 text-left w-16">Unit</th>
                      <th className="p-2 text-right w-28">Unit Price ₹</th>
                      <th className="p-2 text-right w-24">Total ₹</th>
                      <th className="p-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1">
                          <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                            className="w-full border border-outline-variant rounded px-1 py-0.5 text-xs bg-surface-container-lowest text-on-surface" placeholder="SOLAR PANELS" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={item.brand} onChange={e => updateItem(idx, 'brand', e.target.value)}
                            className="w-full border border-outline-variant rounded px-1 py-0.5 text-xs bg-surface-container-lowest text-on-surface" placeholder="WAAREE" />
                        </td>
                        <td className="p-1">
                          <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                            className="w-full border border-outline-variant rounded px-1 py-0.5 text-xs text-center bg-surface-container-lowest text-on-surface" min="1" />
                        </td>
                        <td className="p-1">
                          <input type="text" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}
                            className="w-full border border-outline-variant rounded px-1 py-0.5 text-xs bg-surface-container-lowest text-on-surface" />
                        </td>
                        <td className="p-1">
                          <input type="number" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))}
                            className="w-full border border-outline-variant rounded px-1 py-0.5 text-xs text-right bg-surface-container-lowest text-on-surface" min="0" step="0.01" />
                        </td>
                        <td className="p-2 text-right font-technical-mono text-green-700">
                          ₹{item.line_total.toLocaleString('en-IN')}
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-base font-bold">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-surface-container-low font-bold text-xs border-t border-outline-variant">
                    <tr>
                      <td colSpan={5} className="p-2 text-right text-on-surface-variant">Subtotal</td>
                      <td className="p-2 text-right font-technical-mono">₹{subtotal.toLocaleString('en-IN')}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-label-bold text-on-surface mb-1">Discount %</label>
                  <input type="number" value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} className="input-base" min="0" max="100" step="0.1" />
                </div>
                <div>
                  <label className="block text-label-bold text-on-surface mb-1">GST %</label>
                  <input type="number" value={gstPct} onChange={e => setGstPct(Number(e.target.value))} className="input-base" min="0" max="30" step="0.1" />
                </div>
                <div className="flex flex-col justify-end">
                  <div className="text-right p-3 bg-green-50 border border-green-200 rounded">
                    <div className="text-xs text-green-700">Total Amount</div>
                    <div className="text-lg font-bold text-green-800 font-technical-mono">
                      ₹{Math.round(totalAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-label-bold text-on-surface mb-1">Terms & Conditions</label>
            <textarea value={termsConditions} onChange={e => setTermsConditions(e.target.value)} rows={3} className="input-base text-sm" />
          </div>
        </>
      )}

      <div className="flex justify-between pt-4 border-t border-outline-variant">
        {step !== 'select' && (
          <button type="button" onClick={() => setStep('select')}
            className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors">
            ← Back
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-label-bold text-on-surface hover:bg-surface-container-low rounded transition-colors">Cancel</button>
          {step !== 'select' && (
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Quotation'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function OcrQuotationImportModal({ onClose }: { onClose: () => void; onSuccess: () => void }) {
  const [filePath, setFilePath] = useState('');
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
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath }),
        });
      }
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || 'Failed to parse PDF');
      setQuotationData(data);
    } catch (err: any) {
      alert(err.message || 'Error executing OCR');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border space-y-3">
        <label className="block text-sm font-semibold">Upload Quotation PDF or specify File Path</label>
        <div className="flex gap-2">
          <Input type="file" accept=".pdf" onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} className="flex-1" />
          <Button onClick={handleParse} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
            {loading ? 'Running OCR...' : 'Run OCR'}
          </Button>
        </div>
        <div className="text-xs text-slate-500">Or enter local file path:</div>
        <Input value={filePath} onChange={e => setFilePath(e.target.value)} placeholder="/path/to/quotation.pdf" className="text-xs font-mono" />
      </div>

      {quotationData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-lg">
            <div>
              <span className="font-bold text-amber-900 block text-sm">✓ PDF OCR Parsed</span>
              <span className="text-xs text-amber-700">Customer: {quotationData.customer_name} | {quotationData.capacity}</span>
            </div>
            <div className="flex gap-2">
              <Button variant={viewMode === 'preview' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('preview')}>Pattern Preview</Button>
              <Button variant={viewMode === 'json' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('json')}>JSON Data</Button>
              <Button size="sm" onClick={() => window.print()} className="bg-blue-600 text-white">Print PDF</Button>
            </div>
          </div>
          {viewMode === 'preview' ? (
            <div className="border rounded-lg p-2 bg-slate-100 overflow-x-auto"><SolarQuotationTemplate data={quotationData} /></div>
          ) : (
            <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">{JSON.stringify(quotationData, null, 2)}</pre>
          )}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}
