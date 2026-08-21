'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';

// Function to convert JSON array to CSV string
function convertToCSV(objArray: any[]) {
  if (!objArray || objArray.length === 0) return '';
  
  // Flatten objects if needed, but for simplicity we will just extract top-level keys
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  
  const headers = Object.keys(array[0]).filter(key => typeof array[0][key] !== 'object');
  let str = headers.join(',') + '\r\n';

  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (let index in headers) {
      if (line != '') line += ',';
      
      const val = array[i][headers[index]];
      // Handle commas and quotes in values
      if (val === null || val === undefined) {
        line += '';
      } else if (typeof val === 'string') {
        line += `"${val.replace(/"/g, '""')}"`;
      } else {
        line += val;
      }
    }
    str += line + '\r\n';
  }
  return str;
}

export default function ReportsPage() {
  const [stats, setStats] = useState({
    projects: { total: 0, installation: 0, completed: 0, pendingVerification: 0 },
    discom: { total: 0, pendingJe: 0, pendingSdo: 0, pendingXen: 0 },
    inventory: { panels: 0, inverters: 0, lowStock: 0 },
  });

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedReportTitle, setSelectedReportTitle] = useState('');
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

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

  const handlePreviewReport = async (title: string) => {
    setSelectedReportTitle(title);
    setPreviewModalOpen(true);
    setIsLoadingReport(true);
    setReportData([]);

    try {
      let url = '';
      let dataKey = '';
      
      if (title === 'Project Status Report') {
        url = '/api/projects?limit=1000';
        dataKey = 'projects';
      } else if (title === 'Customer Report') {
        url = '/api/customers?limit=1000';
        dataKey = 'customers';
      } else if (title === 'Inventory Report') {
        url = '/api/inventory/products?limit=1000';
      } else if (title === 'Installation Report') {
        url = '/api/projects?status=INSTALLATION_COMPLETED&limit=1000';
        dataKey = 'projects';
      } else if (title === 'DISCOM Status Report') {
        url = '/api/discom?limit=1000';
        dataKey = 'applications';
      } else if (title === 'Monthly Summary') {
        url = '/api/reports/stats';
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (title === 'Monthly Summary') {
        // Map stats to a flat structure for preview
        setReportData([{
          Total_Projects: data.projects?.total || 0,
          Completed_Projects: data.projects?.completed || 0,
          Total_DISCOM_Apps: data.discom?.total || 0,
          Low_Stock_Items: data.inventory?.lowStock || 0,
        }]);
      } else if (dataKey && data[dataKey]) {
        setReportData(data[dataKey]);
      } else if (Array.isArray(data)) {
        setReportData(data);
      } else if (data.data && Array.isArray(data.data)) {
        setReportData(data.data);
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleDownloadCSV = () => {
    if (reportData.length === 0) return;
    
    const csvStr = convertToCSV(reportData);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReportTitle.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              <button 
                onClick={() => handlePreviewReport(report.title)}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      <Modal isOpen={previewModalOpen} onClose={() => setPreviewModalOpen(false)} title={`Preview: ${selectedReportTitle}`} size="xl">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-on-surface-variant text-sm">
              {isLoadingReport ? 'Fetching data...' : `${reportData.length} records found`}
            </p>
            <button 
              onClick={handleDownloadCSV}
              disabled={isLoadingReport || reportData.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download CSV
            </button>
          </div>

          <div className="border border-outline-variant rounded-lg overflow-x-auto max-h-[60vh]">
            {isLoadingReport ? (
              <div className="p-8 text-center text-on-surface-variant">Loading report data...</div>
            ) : reportData.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">No data available for this report.</div>
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {Object.keys(reportData[0]).filter(k => typeof reportData[0][k] !== 'object').map(key => (
                      <th key={key} className="p-3 text-label-sm font-bold text-on-surface uppercase whitespace-nowrap">
                        {key.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      {Object.keys(row).filter(k => typeof row[k] !== 'object').map(key => (
                        <td key={key} className="p-3 text-body-sm text-on-surface max-w-[200px] truncate">
                          {row[key] !== null && row[key] !== undefined ? String(row[key]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
