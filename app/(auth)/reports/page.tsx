'use client';

import { useState, useEffect } from 'react';

export default function ReportsPage() {
  const [stats, setStats] = useState({
    projects: { total: 0, installation: 0, completed: 0, pendingVerification: 0 },
    discom: { total: 0, pendingJe: 0, pendingSdo: 0, pendingXen: 0 },
    inventory: { panels: 0, inverters: 0, lowStock: 0 },
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [projRes, discRes, invRes] = await Promise.all([
        fetch('/api/reports/stats'),
        fetch('/api/discom/stats'),
        fetch('/api/inventory/stats'),
      ]);

      if (projRes.ok) {
        const data = await projRes.json();
        setStats(prev => ({ ...prev, projects: data.projects || prev.projects }));
      }
      if (discRes.ok) {
        const data = await discRes.json();
        setStats(prev => ({ ...prev, discom: data.stats || prev.discom }));
      }
      if (invRes.ok) {
        const data = await invRes.json();
        setStats(prev => ({ ...prev, inventory: data.stats || prev.inventory }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const reportTypes = [
    { title: 'Project Status Report', desc: 'Complete list of all projects with current status', icon: 'folder_open' },
    { title: 'Customer Report', desc: 'Customer list with project count and details', icon: 'groups' },
    { title: 'Inventory Report', desc: 'Stock summary with low stock alerts', icon: 'inventory_2' },
    { title: 'Installation Report', desc: 'Completed installations with verification status', icon: 'engineering' },
    { title: 'DISCOM Status Report', desc: 'DISCOM applications and approval tracking', icon: 'account_balance' },
    { title: 'Monthly Summary', desc: 'Monthly performance and activity summary', icon: 'trending_up' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Reports & Analytics</h1>
        <p className="text-body-md text-on-surface-variant mt-1">System overview and reports</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Total Projects</div>
          <div className="text-headline-md font-bold text-on-surface">{stats.projects.total}</div>
          <p className="text-label-sm text-secondary mt-1">{stats.projects.completed} completed</p>
        </div>

        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Active Installation</div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">trending_up</span>
            <span className="text-headline-md font-bold text-on-surface">{stats.projects.installation}</span>
          </div>
        </div>

        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">DISCOM Apps</div>
          <div className="text-headline-md font-bold text-on-surface">{stats.discom.total}</div>
          <p className="text-label-sm text-secondary mt-1">{stats.discom.pendingJe} JE pending</p>
        </div>

        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Low Stock Items</div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error">inventory_2</span>
            <span className="text-headline-md font-bold text-error">{stats.inventory.lowStock}</span>
          </div>
        </div>
      </div>

      {/* Available Reports */}
      <div className="card-base p-6">
        <h3 className="text-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant">Available Reports</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => (
            <div key={report.title} className="border border-outline-variant rounded p-4 hover:border-primary-container transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary-container">description</span>
                <h4 className="font-label-bold text-on-surface">{report.title}</h4>
              </div>
              <p className="text-body-md text-on-surface-variant mb-4">{report.desc}</p>
              <button className="btn-outline w-full flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">download</span>
                Generate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
