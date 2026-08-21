'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Types
interface DiscomStats {
  totalApplications: number;
  pendingDocuments: number;
  submitted: number;
  jePending: number;
  sdoPending: number;
  xenPending: number;
  estimateGenerated: number;
  feePaid: number;
  approved: number;
  rejected: number;
}

interface UrgentApplication {
  id: number;
  application_id: string;
  project_id: string;
  customer: string;
  discom: string;
  status: string;
  pending_days: number;
}

interface PendingDocument {
  id: number;
  application_id: string;
  customer: string;
  missing_docs: string;
  submitted: string;
}

interface RecentApproval {
  id: number;
  application_id: string;
  customer: string;
  discom: string;
  status: string;
  approved: string;
}

export default function DiscomDashboardPage() {
  const [stats, setStats] = useState<DiscomStats>({
    totalApplications: 0,
    pendingDocuments: 0,
    submitted: 0,
    jePending: 0,
    sdoPending: 0,
    xenPending: 0,
    estimateGenerated: 0,
    feePaid: 0,
    approved: 0,
    rejected: 0,
  });
  const [urgentApplications, setUrgentApplications] = useState<UrgentApplication[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        setUser(sessionData.user);
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch stats
        const statsRes = await fetch(`/api/dashboard/stats?role=${user.role}`);
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch urgent applications
        const urgentRes = await fetch('/api/dashboard/discom?type=urgent');
        const urgentData = await urgentRes.json();
        setUrgentApplications(urgentData);

        // Fetch pending documents
        const pendingRes = await fetch('/api/dashboard/discom?type=pending-docs');
        const pendingData = await pendingRes.json();
        setPendingDocuments(pendingData);

        // Fetch recent approvals
        const approvalsRes = await fetch('/api/dashboard/discom?type=recent-approvals');
        const approvalsData = await approvalsRes.json();
        setRecentApprovals(approvalsData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const getStageBadge = (status: string) => {
    const badges: Record<string, { color: string; bg: string }> = {
      'DOCUMENTS_PENDING': { color: 'text-on-error-container', bg: 'bg-error-container' },
      'JE_PENDING': { color: 'text-on-primary-container', bg: 'bg-primary-container' },
      'SDO_PENDING': { color: 'text-on-primary-container', bg: 'bg-primary-container' },
      'XEN_PENDING': { color: 'text-on-primary-container', bg: 'bg-primary-container' },
      'ESTIMATE_GENERATED': { color: 'text-on-surface', bg: 'bg-purple-100' },
      'FEE_PAID': { color: 'text-on-surface', bg: 'bg-blue-100' },
      'APPROVED': { color: 'text-on-tertiary-fixed', bg: 'bg-tertiary-fixed' },
    };
    const badge = badges[status] || { color: 'text-on-surface', bg: 'bg-surface-variant' };
    return (
      <span className={`text-xs font-label-bold px-2 py-1 rounded ${badge.bg} ${badge.color}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-container"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">DISCOM Applications</h1>
          <p className="text-on-surface-variant mt-1">Track and manage all DISCOM applications</p>
        </div>
        <div className="flex gap-3">
          <Link href="/discom/new">
            <button className="px-4 py-2 bg-primary-container text-on-secondary-fixed font-label-bold rounded hover:bg-primary-fixed-dim transition-colors industrial-shadow flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New Application
            </button>
          </Link>
          <Link href="/discom/bulk-upload">
            <button className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-on-secondary-fixed font-label-bold rounded hover:bg-surface-container-low transition-colors industrial-shadow flex items-center gap-2">
              <span className="material-symbols-outlined">upload</span>
              Bulk Upload
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Total Applications</span>
            <span className="material-symbols-outlined text-secondary">folder_open</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.totalApplications}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">All time</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Pending Documents</span>
            <span className="material-symbols-outlined text-error">warning</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.pendingDocuments}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-error">Needs attention</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Submitted</span>
            <span className="material-symbols-outlined text-primary-container">send</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.submitted}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Awaiting approval</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Approved</span>
            <span className="material-symbols-outlined text-tertiary">check_circle</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.approved}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-tertiary">This month</div>
        </div>
      </div>

      {/* Stage-wise Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-5 industrial-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-warning-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-warning-container">engineering</span>
            </div>
            <div>
              <div className="font-label-bold text-on-surface">JE Stage</div>
              <div className="text-xs text-on-surface-variant">Junior Engineer</div>
            </div>
          </div>
          <div className="text-3xl font-bold text-on-surface">{stats.jePending}</div>
          <div className="text-sm text-on-surface-variant mt-1">Pending approval</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-5 industrial-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-warning-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-warning-container">account_balance</span>
            </div>
            <div>
              <div className="font-label-bold text-on-surface">SDO Stage</div>
              <div className="text-xs text-on-surface-variant">Sub Divisional Officer</div>
            </div>
          </div>
          <div className="text-3xl font-bold text-on-surface">{stats.sdoPending}</div>
          <div className="text-sm text-on-surface-variant mt-1">Pending approval</div>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded p-5 industrial-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-warning-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-warning-container">business</span>
            </div>
            <div>
              <div className="font-label-bold text-on-surface">XEN Stage</div>
              <div className="text-xs text-on-surface-variant">Executive Engineer</div>
            </div>
          </div>
          <div className="text-3xl font-bold text-on-surface">{stats.xenPending}</div>
          <div className="text-sm text-on-surface-variant mt-1">Pending approval</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Applications */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface">Urgent Applications</h3>
            <span className="text-xs text-error font-label-bold px-2 py-1 bg-error-container rounded">Needs Action</span>
          </div>
          <div className="space-y-3">
            {urgentApplications.length > 0 ? urgentApplications.map((app) => (
              <div key={app.id} className="p-3 border border-outline-variant rounded bg-surface-bright hover:bg-surface-container-low transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-on-surface-variant">{app.application_id}</span>
                    </div>
                    <div className="font-label-bold text-on-surface">{app.customer}</div>
                    <div className="text-sm text-on-surface-variant">{app.discom}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  {getStageBadge(app.status)}
                  <span className="text-xs text-error">Pending {app.pending_days} days</span>
                </div>
              </div>
            )) : (
              <div className="text-center text-on-surface-variant py-4">No urgent applications</div>
            )}
          </div>
        </div>

        {/* Pending Documents */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface">Pending Documents</h3>
            <span className="text-xs text-secondary font-label-bold">{pendingDocuments.length} cases</span>
          </div>
          <div className="space-y-3">
            {pendingDocuments.length > 0 ? pendingDocuments.map((item) => (
              <div key={item.id} className="p-3 border border-outline-variant rounded bg-surface-bright">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-mono text-sm text-on-surface-variant">{item.application_id}</div>
                    <div className="font-label-bold text-on-surface">{item.customer}</div>
                  </div>
                  <span className="text-xs text-secondary">{new Date(item.submitted).toLocaleDateString()}</span>
                </div>
                <div className="mt-2">
                  <div className="text-sm text-on-surface-variant mb-1">Missing Documents:</div>
                  <div className="flex flex-wrap gap-1">
                    {item.missing_docs.split(',').map((doc, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-error-container/30 text-on-error-container rounded">
                        {doc.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-on-surface-variant py-4">No pending documents</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Approvals */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
          <h3 className="text-xl font-bold text-on-surface">Recent Approvals</h3>
          <Link href="/discom?status=approved" className="text-primary font-label-sm hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentApprovals.length > 0 ? recentApprovals.map((approval) => (
            <div key={approval.id} className="p-4 border border-outline-variant rounded bg-surface-bright flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-tertiary-fixed">check</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-label-bold text-on-surface truncate">{approval.customer}</div>
                <div className="text-sm text-on-surface-variant">{approval.discom}</div>
                <div className="text-xs text-secondary mt-1">{approval.status.replace(/_/g, ' ')} • {new Date(approval.approved).toLocaleDateString()}</div>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center text-on-surface-variant py-4">No recent approvals</div>
          )}
        </div>
      </div>
    </div>
  );
}
