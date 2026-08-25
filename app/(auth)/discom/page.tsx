'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DiscomApplication {
  id: number;
  application_id: string;
  project_id: string;
  customer_name: string;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  'DRAFT': { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  'DOCUMENTS_PENDING': { label: 'Documents Pending', color: 'bg-yellow-100 text-yellow-800' },
  'DOCUMENTS_VERIFIED': { label: 'Documents Verified', color: 'bg-blue-100 text-blue-800' },
  'SUBMITTED_TO_DISCOM': { label: 'Submitted to DISCOM', color: 'bg-purple-100 text-purple-800' },
  'JE_PENDING': { label: 'JE Pending', color: 'bg-orange-100 text-orange-800' },
  'JE_APPROVED': { label: 'JE Approved', color: 'bg-cyan-100 text-cyan-800' },
  'SDO_PENDING': { label: 'SDO Pending', color: 'bg-indigo-100 text-indigo-800' },
  'SDO_APPROVED': { label: 'SDO Approved', color: 'bg-teal-100 text-teal-800' },
  'XEN_PENDING': { label: 'XEN Pending', color: 'bg-pink-100 text-pink-800' },
  'XEN_APPROVED': { label: 'XEN Approved', color: 'bg-violet-100 text-violet-800' },
  'ESTIMATE_GENERATED': { label: 'Estimate Generated', color: 'bg-amber-100 text-amber-800' },
  'FEE_PAID': { label: 'Fee Paid', color: 'bg-emerald-100 text-emerald-800' },
  'APPROVED': { label: 'Approved', color: 'bg-green-100 text-green-800' },
  'COMPLETED': { label: 'Completed', color: 'bg-green-600 text-white' },
};

export default function DiscomPage() {
  const [applications, setApplications] = useState<DiscomApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pendingJe: 0, pendingSdo: 0, pendingXen: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, statsRes] = await Promise.all([
        fetch('/api/discom/applications'),
        fetch('/api/discom/stats'),
      ]);

      if (appRes.ok) {
        const data = await appRes.json();
        setApplications(data.applications || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || { total: 0, pendingJe: 0, pendingSdo: 0, pendingXen: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-bold text-on-surface">DISCOM Applications</h1>
          <p className="text-body-md text-on-surface-variant mt-1">Manage DISCOM applications and approvals</p>
        </div>
        <Link href="/discom/new">
          <button className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined">description</span>
            New Application
          </button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Total Applications</div>
          <div className="text-headline-md font-bold text-on-surface">{stats.total}</div>
        </div>

        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Pending JE</div>
          <div className="text-headline-md font-bold text-primary-container">{stats.pendingJe}</div>
        </div>

        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Pending SDO</div>
          <div className="text-headline-md font-bold text-tertiary">{stats.pendingSdo}</div>
        </div>

        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Pending XEN</div>
          <div className="text-headline-md font-bold text-secondary">{stats.pendingXen}</div>
        </div>
      </div>

      {loading ? (
        <div className="card-base p-6"><div className="text-center py-8">Loading...</div></div>
      ) : applications.length === 0 ? (
        <div className="card-base p-6"><div className="text-center py-8">No applications found</div></div>
      ) : (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 text-left text-label-bold text-on-surface-variant">Application ID</th>
                  <th className="px-4 py-3 text-left text-label-bold text-on-surface-variant">Project</th>
                  <th className="px-4 py-3 text-left text-label-bold text-on-surface-variant">Customer</th>
                  <th className="px-4 py-3 text-left text-label-bold text-on-surface-variant">Application Date</th>
                  <th className="px-4 py-3 text-left text-label-bold text-on-surface-variant">Status</th>
                  <th className="px-4 py-3 text-right text-label-bold text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {applications.map((app: any) => {
                  const status = statusConfig[app.status] || { label: app.status, color: 'bg-gray-100' };
                  return (
                    <tr key={app.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-sm font-technical-mono">{app.application_id}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{app.project_id}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{app.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        {app.application_date ? new Date(app.application_date).toLocaleDateString('en-IN') : (app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN') : 'N/A')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/discom/${app.id}`}>
                          <button className="p-2 rounded hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
