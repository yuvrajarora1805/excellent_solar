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

  // Modals state
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  // Form state
  const [stage, setStage] = useState('je');
  const [status, setStatus] = useState('APPROVED');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      case 'DRAFT': return 'default';
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

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

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
          <h3 className="text-lg font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Application Details</h3>
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
              <span className="text-on-surface-variant">Submission Date:</span>
              <span className="font-medium text-on-surface">{application.submission_date ? new Date(application.submission_date).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Verification Status</h3>
            <Button variant="outline" size="sm" onClick={() => setIsVerificationModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" /> Manage
            </Button>
          </div>
          <div className="space-y-4 text-sm">
            
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

        {/* Documents */}
        <div className="col-span-1 md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-lg font-bold text-on-surface">Documents</h3>
            <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)}>
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

      {/* Upload Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Document">
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
