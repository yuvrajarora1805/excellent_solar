'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: number;
  project_id: string;
  customer_name: string;
  customer_mobile: string;
  status: string;
}

export default function NewDiscomApplicationPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setFetchingProjects(true);
      try {
        // Fetch projects that don't already have a discom application
        const res = await fetch('/api/projects?limit=200');
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setFetchingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setFormData({ project_id: id });
    const proj = projects.find(p => p.id.toString() === id);
    setSelectedProject(proj || null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      setError('Please select a project');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/discom/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: parseInt(formData.project_id) }),
      });

      if (res.ok) {
        router.push('/discom');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create application');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/discom" className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </Link>
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">New DISCOM Application</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Link a project to start its DISCOM approval process</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div className="card-base p-6 space-y-6">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">assignment</span>
            Select Project
          </h2>

          <div>
            <label className="block text-label-bold text-on-surface mb-2" htmlFor="project_id">
              Project
            </label>
            <select
              id="project_id"
              value={formData.project_id}
              onChange={handleProjectChange}
              className="input-base cursor-pointer"
              disabled={fetchingProjects}
              required
            >
              <option value="">
                {fetchingProjects ? 'Loading projects...' : 'Select a project...'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_id} — {p.customer_name} ({p.customer_mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Selected project preview */}
          {selectedProject && (
            <div className="bg-surface-container-low rounded-xl p-4 space-y-3 border border-outline-variant">
              <h3 className="text-label-bold text-on-surface-variant uppercase tracking-wider text-xs">Project Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Project ID</div>
                  <div className="font-technical-mono font-medium text-on-surface">{selectedProject.project_id}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Customer</div>
                  <div className="font-medium text-on-surface">{selectedProject.customer_name}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Mobile</div>
                  <div className="text-on-surface">{selectedProject.customer_mobile}</div>
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant mb-1">Project Status</div>
                  <span className="status-badge bg-secondary-container text-on-secondary-container">
                    {selectedProject.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DISCOM Process Info */}
        <div className="card-base p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">info</span>
            What Happens Next
          </h2>
          <div className="space-y-3">
            {[
              { icon: 'folder_open', label: 'Documents Collection', desc: 'Upload all required documents for submission' },
              { icon: 'engineering', label: 'JE Verification', desc: 'Junior Engineer site inspection and approval' },
              { icon: 'verified_user', label: 'SDO / XEN Approval', desc: 'Sub-Divisional Officer and Executive Engineer approvals' },
              { icon: 'receipt_long', label: 'Estimate & Fee', desc: 'DISCOM estimate generation and fee payment' },
              { icon: 'check_circle', label: 'Final Approval', desc: 'Grid connection approval and meter installation' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary-container text-sm">{step.icon}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">{step.label}</div>
                  <div className="text-xs text-on-surface-variant">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/discom">
            <button type="button" className="btn-secondary">Cancel</button>
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.project_id}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">add_circle</span>
                Create Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
