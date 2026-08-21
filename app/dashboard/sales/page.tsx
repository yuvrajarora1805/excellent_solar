'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Types
interface SalesStats {
  newLeads: number;
  pendingQuotes: number;
  quotesSent: number;
  scheduledSurveys: number;
}

interface PipelineItem {
  stage: string;
  count: number;
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  city: string;
  created_at: string;
  project_status: string;
}

interface SurveySchedule {
  customer: string;
  location: string;
  date: string;
  time: string;
  worker: string;
}

const getStageColor = (stage: string) => {
  const colors: Record<string, { color: string; border: string }> = {
    'Lead': { color: 'bg-secondary-container', border: 'border-secondary' },
    'Survey': { color: 'bg-blue-100', border: 'border-blue-400' },
    'Quotation': { color: 'bg-purple-100', border: 'border-purple-400' },
    'Install': { color: 'bg-primary-fixed', border: 'border-primary-container' },
    'Done': { color: 'bg-tertiary-container', border: 'border-tertiary' },
  };
  return colors[stage] || { color: 'bg-surface-variant', border: 'border-outline-variant' };
};

export default function SalesDashboardPage() {
  const [stats, setStats] = useState<SalesStats>({
    newLeads: 0,
    pendingQuotes: 0,
    quotesSent: 0,
    scheduledSurveys: 0,
  });
  const [pipelineData, setPipelineData] = useState<PipelineItem[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
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

        // Fetch pipeline data
        const pipelineRes = await fetch('/api/dashboard/pipeline');
        const pipelineData = await pipelineRes.json();
        setPipelineData(pipelineData);

        // Fetch recent customers
        const customersRes = await fetch('/api/dashboard/customers?limit=5');
        const customersData = await customersRes.json();
        setRecentCustomers(customersData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
          <h1 className="text-2xl font-bold text-on-surface">Sales Dashboard</h1>
          <p className="text-on-surface-variant mt-1">Welcome back! Here's your sales overview.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/customers/new">
            <button className="px-4 py-2 bg-primary-container text-on-secondary-fixed font-label-bold rounded hover:bg-primary-fixed-dim transition-colors industrial-shadow flex items-center gap-2">
              <span className="material-symbols-outlined">person_add</span>
              New Customer
            </button>
          </Link>
          <Link href="/quotations/new">
            <button className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-on-secondary-fixed font-label-bold rounded hover:bg-surface-container-low transition-colors industrial-shadow flex items-center gap-2">
              <span className="material-symbols-outlined">add</span>
              New Quote
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Header - Sales Focused */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Leads */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">New Leads</span>
            <span className="material-symbols-outlined text-secondary">person_add</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.newLeads}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Last 7 days</div>
        </div>

        {/* Pending Quotes */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Pending Quotes</span>
            <span className="material-symbols-outlined text-tertiary">description</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.pendingQuotes}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Needs follow-up</div>
        </div>

        {/* Quotes Sent */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Quotes Sent</span>
            <span className="material-symbols-outlined text-primary-container">send</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.quotesSent}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Last 30 days</div>
        </div>

        {/* Scheduled Surveys */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-bold text-on-surface-variant">Surveys Scheduled</span>
            <span className="material-symbols-outlined text-blue-500">calendar_today</span>
          </div>
          <div className="text-2xl font-bold text-on-surface">{stats.scheduledSurveys}</div>
          <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Next 7 days</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface">Sales Pipeline</h3>
            <Link href="/projects" className="text-primary font-label-sm hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {pipelineData.length > 0 ? pipelineData.map((item) => {
              const styles = getStageColor(item.stage);
              return (
                <div key={item.stage} className="flex items-center gap-4 group">
                  <div className="w-16 text-right font-label-bold text-on-surface-variant">{item.stage}</div>
                  <div className="flex-1 h-8 bg-surface-container rounded relative overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full ${styles.color} transition-all group-hover:opacity-80 border-l-2 ${styles.border}`}
                      style={{ width: `${(item.count / (pipelineData[0]?.count || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-12 font-mono text-sm">{item.count}</div>
                </div>
              );
            }) : (
              <div className="text-center text-on-surface-variant py-8">No projects found</div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
            <h3 className="text-lg font-bold text-on-surface mb-4">Conversion Rate</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant">Lead to Quote</span>
                  <span className="font-bold text-secondary">Calculating...</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full bg-secondary" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Customers */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
          <h3 className="text-xl font-bold text-on-surface">Recent Customers</h3>
          <Link href="/customers" className="text-primary font-label-sm hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {recentCustomers.length > 0 ? recentCustomers.map((customer) => (
            <div
              key={customer.id}
              className="flex justify-between items-center p-3 border border-outline-variant rounded bg-surface-bright hover:bg-surface-container-low transition-colors"
            >
              <div className="flex-1">
                <div className="font-label-bold text-on-surface">{customer.name}</div>
                <div className="text-sm text-on-surface-variant">{customer.city}</div>
              </div>
              <div className="text-right">
                <div
                  className={`text-xs font-label-bold px-2 py-1 rounded ${
                    !customer.project_status || customer.project_status === 'NEW'
                      ? 'bg-secondary-container text-on-secondary-fixed'
                      : 'bg-tertiary-container text-on-tertiary-fixed'
                  }`}
                >
                  {customer.project_status || 'New Lead'}
                </div>
                <div className="text-xs text-secondary mt-1">
                  {new Date(customer.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-on-surface-variant py-8">No customers found</div>
          )}
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/customers">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-3xl text-secondary mb-2">groups</span>
            <div className="font-label-bold text-on-surface">Customers</div>
            <div className="text-sm text-on-surface-variant">Manage leads</div>
          </div>
        </Link>
        <Link href="/quotations">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-3xl text-primary-container mb-2">description</span>
            <div className="font-label-bold text-on-surface">Quotations</div>
            <div className="text-sm text-on-surface-variant">Create & send</div>
          </div>
        </Link>
        <Link href="/projects">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-3xl text-tertiary mb-2">solar_power</span>
            <div className="font-label-bold text-on-surface">Projects</div>
            <div className="text-sm text-on-surface-variant">Track progress</div>
          </div>
        </Link>
        <Link href="/survey">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-3xl text-blue-500 mb-2">calendar_month</span>
            <div className="font-label-bold text-on-surface">Scheduling</div>
            <div className="text-sm text-on-surface-variant">Surveys & installs</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
