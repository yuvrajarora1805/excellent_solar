'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-layout';
import { StatusBadge } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, Upload, Edit } from 'lucide-react';

export default function DiscomApplicationDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUpdateFieldsModalOpen, setIsUpdateFieldsModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  // Form state
  const [stage, setStage] = useState('je');
  const [status, setStatus] = useState('APPROVED');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileApply, setIsFileApply] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [updateFields, setUpdateFields] = useState({
    processing_fee: '',
    je_name: '',
    je_phone: '',
    np_number: '',
    application_date: ''
  });

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/discom/${id}`);
      if (!res.ok) {
        throw new Error('Application not found');
      }
      const data = await res.json();
      setApplication(data);
      setUpdateFields({
        processing_fee: data.processing_fee || '',
        je_name: data.je_name || '',
        je_phone: data.je_phone || '',
        np_number: data.np_number || '',
        application_date: data.application_date ? data.application_date.toString().split('T')[0] : ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success';
      case 'SUBMITTED': 
      case 'VERIFICATION_PENDING':
      case 'FEASIBILITY_PENDING':
        return 'warning';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const handleUpdateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/discom/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage, status })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setIsVerificationModalOpen(false);
      fetchApplication(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFields = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/discom/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_fields',
          updateData: {
            processing_fee: updateFields.processing_fee ? parseFloat(updateFields.processing_fee) : null,
            je_name: updateFields.je_name,
            je_phone: updateFields.je_phone,
            np_number: updateFields.np_number
          }
        })
      });
      if (!res.ok) throw new Error('Failed to update fields');
      setIsUpdateFieldsModalOpen(false);
      fetchApplication(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (isFileApply) {
        formData.append('is_file_apply', 'true');
      }

      const res = await fetch(`/api/discom/${id}`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload document');
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      fetchApplication(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-on-surface-variant">Loading application details...</div>;
  }

  if (error || !application) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <div className="bg-error-container text-on-error-container p-4 rounded-lg flex flex-col items-center gap-4">
          <AlertCircle className="w-8 h-8" />
          <p className="font-medium text-center">{error || 'Application not found'}</p>
          <Button onClick={() => router.push('/discom')} variant="outline">
            Back to DISCOM
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/discom')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader 
          title={`DISCOM Application #${application.application_id || application.id}`}
          description={`Project: ${application.project_id} - ${application.customer_name}`}
        />
        <div className="ml-auto">
          <StatusBadge status={application.status} variant={getStatusVariant(application.status)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Application Details */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Application Details</h3>
            <Button variant="outline" size="sm" onClick={() => setIsUpdateFieldsModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Details
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Application ID:</span>
              <span className="font-medium text-on-surface">{application.application_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Project:</span>
              <span className="font-medium text-on-surface">{application.project_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Customer:</span>
              <span className="font-medium text-on-surface">{application.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">NP Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-on-surface">{application.np_number || 'N/A'}</span>
                {application.np_confirmed ? (
                  <span className="px-2 py-0.5 text-xs font-bold bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 rounded border border-green-300">
                    Confirmed
                  </span>
                ) : application.np_number ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs text-amber-700 border-amber-400 hover:bg-amber-50"
                    onClick={async () => {
                      try {
                        const res = await fetch(`/api/discom/${id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'confirm_np', np_number: application.np_number })
                        });
                        if (res.ok) fetchApplication();
                      } catch (e) { console.error(e); }
                    }}
                  >
                    Confirm NP
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Office Approval Status:</span>
              <span className={`font-bold text-xs px-2.5 py-0.5 rounded ${
                application.office_approval_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                application.office_approval_status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {application.office_approval_status || 'PENDING'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Application Date:</span>
              <span className="font-medium text-on-surface">{application.application_date ? new Date(application.application_date).toLocaleDateString('en-IN') : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Processing Fee:</span>
              <span className="font-medium text-on-surface">{application.processing_fee ? `₹${application.processing_fee}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">JE Name / Phone:</span>
              <span className="font-medium text-on-surface">
                {application.je_name ? `${application.je_name} ${application.je_phone ? `(${application.je_phone})` : ''}` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">File Apply Upload:</span>
              <span className="font-medium text-on-surface">
                {application.file_apply_upload_path ? (
                   <a href={application.file_apply_upload_path} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                     <FileText className="w-4 h-4"/> View File
                   </a>
                ) : (
                   <Button variant="ghost" size="sm" onClick={() => { setIsFileApply(true); setIsUploadModalOpen(true); }} className="h-6 px-2 text-xs">
                     Upload
                   </Button>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-on-surface-variant">Submission Date:</span>
              <span className="font-medium text-on-surface">{application.submission_date ? new Date(application.submission_date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
          
          {/* Office Approval Actions Bar */}
          <div className="mt-6 pt-4 border-t border-outline-variant flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Office Person Approval:</span>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/discom/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'office_approve', status: 'APPROVED', remarks: 'Approved by Office' })
                  });
                  if (res.ok) fetchApplication();
                } catch (e) { alert('Approval failed'); }
              }}
            >
              Approve DISCOM Application
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-rose-600 border-rose-300 hover:bg-rose-50 h-8 text-xs"
              onClick={async () => {
                const reason = prompt('Enter rejection reason:');
                if (reason) {
                  try {
                    const res = await fetch(`/api/discom/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'office_approve', status: 'REJECTED', remarks: reason })
                    });
                    if (res.ok) fetchApplication();
                  } catch (e) { alert('Rejection failed'); }
                }
              }}
            >
              Reject
            </Button>
          </div>
        </div>

        {/* Verification Status & DISCOM Meter Details */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
              <h3 className="text-lg font-bold text-on-surface">Verification Status</h3>
              <Button variant="outline" size="sm" onClick={() => setIsVerificationModalOpen(true)}>
                <Edit className="w-4 h-4 mr-2" /> Manage
              </Button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                {application.je_verification_status === 'APPROVED' ? 
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> : 
                  <Clock className="w-5 h-5 text-amber-500" />
                }
                <div>
                  <p className="font-medium">JE Verification</p>
                  <p className="text-xs text-on-surface-variant">Status: {application.je_verification_status || 'PENDING'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {application.sdo_verification_status === 'APPROVED' ? 
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> : 
                  <Clock className="w-5 h-5 text-amber-500" />
                }
                <div>
                  <p className="font-medium">SDO Verification</p>
                  <p className="text-xs text-on-surface-variant">Status: {application.sdo_verification_status || 'PENDING'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {application.xen_verification_status === 'APPROVED' ? 
                  <CheckCircle2 className="w-5 h-5 text-green-600" /> : 
                  <Clock className="w-5 h-5 text-amber-500" />
                }
                <div>
                  <p className="font-medium">XEN Verification</p>
                  <p className="text-xs text-on-surface-variant">Status: {application.xen_verification_status || 'PENDING'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DISCOM Meter Status & Meter Effect Section */}
          <div className="pt-4 border-t border-outline-variant">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
              <span>Meter Details (From Mobile Field User)</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/discom/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'verify_meter', meter_status: 'AVAILABLE', meter_effect: 'YES' })
                    });
                    if (res.ok) fetchApplication();
                  } catch (e) { alert('Failed'); }
                }}
              >
                Verify Meter
              </Button>
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-slate-500 block">Meter Status:</span>
                <span className={`font-bold ${application.meter_status === 'AVAILABLE' ? 'text-green-600' : 'text-amber-600'}`}>
                  {application.meter_status || 'PENDING'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Meter Effect:</span>
                <span className={`font-bold ${application.meter_effect === 'YES' ? 'text-green-600' : 'text-slate-600'}`}>
                  {application.meter_effect || 'NO'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Documents</h3>
            <Button variant="outline" size="sm" onClick={() => { setIsFileApply(false); setIsUploadModalOpen(true); }}>
              <Upload className="w-4 h-4 mr-2" /> Upload Document
            </Button>
          </div>
          {application.documents && application.documents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {application.documents.map((doc: any) => (
                <button 
                  key={doc.id} 
                  onClick={() => setViewingDoc(doc)}
                  className="flex items-center gap-3 p-3 border border-outline-variant rounded hover:bg-surface-container transition-colors text-left"
                >
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm truncate" title={doc.document_type_name || 'Document'}>
                      {doc.document_type_name || 'Document'}
                    </p>
                    <p className="text-xs text-on-surface-variant truncate">Status: {doc.status}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm italic">No documents uploaded for this application.</p>
          )}
        </div>

        {/* Store Data & Dispatch Challans */}
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <h3 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center justify-between">
            <span>Store & Material Dispatch Data (Challans)</span>
            <span className="text-xs font-normal text-slate-500">
              Associated Dispatch Orders & Issued Inventory
            </span>
          </h3>

          {application.store_challans && application.store_challans.length > 0 ? (
            <div className="space-y-4">
              {application.store_challans.map((challan: any) => (
                <div key={challan.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded bg-slate-50/50 dark:bg-slate-900/40 text-sm space-y-3">
                  <div className="flex flex-wrap justify-between items-center font-semibold text-slate-800 dark:text-slate-200">
                    <div>
                      <span className="text-primary font-mono mr-2">Challan #{challan.order_number}</span>
                      <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{challan.status}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Dispatched: {challan.dispatched_at ? new Date(challan.dispatched_at).toLocaleString('en-IN') : 'Pending Dispatch'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div><span className="font-semibold block text-slate-800 dark:text-slate-300">Vehicle:</span> {challan.vehicle_number || 'N/A'}</div>
                    <div><span className="font-semibold block text-slate-800 dark:text-slate-300">Driver:</span> {challan.driver_name ? `${challan.driver_name} (${challan.driver_mobile || ''})` : 'N/A'}</div>
                    <div><span className="font-semibold block text-slate-800 dark:text-slate-300">Delivery Address:</span> {challan.delivery_address || 'N/A'}</div>
                    <div>
                      <span className="font-semibold block text-slate-800 dark:text-slate-300">Vehicle Photo:</span>
                      {challan.vehicle_photo_path ? (
                        <a href={challan.vehicle_photo_path} target="_blank" rel="noreferrer" className="text-primary underline">View Photo</a>
                      ) : 'None'}
                    </div>
                  </div>

                  {challan.items && challan.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Dispatched Items:</p>
                      <ul className="text-xs space-y-1">
                        {challan.items.map((it: any) => (
                          <li key={it.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>• {it.product_name} ({it.product_code})</span>
                            <span className="font-bold">{it.quantity} {it.unit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm italic">No store dispatch challans created yet for this project.</p>
          )}
        </div>

      </div>

      {/* Verification Modal */}
      <Modal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} title="Manage Verification Status">
        <form onSubmit={handleUpdateVerification} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Verification Stage</label>
            <select 
              className="w-full p-2 border rounded" 
              value={stage} 
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="je">JE Verification</option>
              <option value="sdo">SDO Verification</option>
              <option value="xen">XEN Verification</option>
              <option value="second_approval">Second Approval</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Status</label>
            <select 
              className="w-full p-2 border rounded" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsVerificationModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Fields Modal */}
      <Modal isOpen={isUpdateFieldsModalOpen} onClose={() => setIsUpdateFieldsModalOpen(false)} title="Update Application Details">
        <form onSubmit={handleUpdateFields} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Processing Fee (₹)</label>
            <input 
              type="number" 
              step="0.01"
              className="w-full p-2 border rounded bg-surface-container-low" 
              value={updateFields.processing_fee} 
              onChange={(e) => setUpdateFields({...updateFields, processing_fee: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">NP Number</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded bg-surface-container-low" 
              value={updateFields.np_number} 
              onChange={(e) => setUpdateFields({...updateFields, np_number: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Application Date</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded bg-surface-container-low" 
              value={updateFields.application_date} 
              onChange={(e) => setUpdateFields({...updateFields, application_date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">JE Name</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded bg-surface-container-low" 
              value={updateFields.je_name} 
              onChange={(e) => setUpdateFields({...updateFields, je_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">JE Phone</label>
            <input 
              type="tel" 
              className="w-full p-2 border rounded bg-surface-container-low" 
              value={updateFields.je_phone} 
              onChange={(e) => setUpdateFields({...updateFields, je_phone: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsUpdateFieldsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Save Details'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title={isFileApply ? "Upload File Apply Document" : "Upload Document"}>
        <form onSubmit={handleUploadDocument} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Select File</label>
            <input 
              type="file" 
              className="w-full p-2 border rounded" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              required 
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? 'Uploading...' : 'Upload Document'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal isOpen={!!viewingDoc} onClose={() => setViewingDoc(null)} title={viewingDoc?.document_type_name || 'Document Viewer'}>
        <div className="flex flex-col h-[70vh]">
          {viewingDoc && viewingDoc.file_path.toLowerCase().endsWith('.pdf') ? (
            <iframe 
              src={viewingDoc.file_path} 
              className="w-full flex-1 border border-outline-variant rounded"
              title="Document Viewer"
            />
          ) : viewingDoc ? (
            <div className="flex-1 overflow-auto flex items-center justify-center bg-surface-container-lowest border border-outline-variant rounded">
              <img 
                src={viewingDoc.file_path} 
                alt="Document" 
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : null}
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setViewingDoc(null)}>Close</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
