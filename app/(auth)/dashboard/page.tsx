'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

// Types for dashboard data
interface DashboardStats {
  newLeads: number;
  activeJobs: number;
  installsThisMonth: number;
  pendingDiscom: number;
  activeUsers: number;
  monthlyRevenue: number;
  schedule?: {
    surveys: number;
    installations: number;
    discomTasks: number;
  };
}

interface PipelineItem {
  stage: string;
  count: number;
}

interface InventoryItem {
  name: string;
  current: number;
  total: number;
  reserved: number;
  status: string;
}

interface Customer {
  id: number;
  name: string;
  mobile: string;
  city: string;
  created_at: string;
}

const getStageColor = (stage: string) => {
  const colors: Record<string, { color: string; border: string }> = {
    'Lead': { color: 'bg-secondary-container', border: 'border-secondary' },
    'Survey': { color: 'bg-blue-100', border: 'border-blue-400' },
    'DISCOM': { color: 'bg-error-container', border: 'border-error' },
    'Install': { color: 'bg-primary-fixed', border: 'border-primary-container' },
    'Done': { color: 'bg-tertiary-container', border: 'border-tertiary' },
  };
  return colors[stage] || { color: 'bg-surface-variant', border: 'border-outline-variant' };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    newLeads: 0,
    activeJobs: 0,
    installsThisMonth: 0,
    pendingDiscom: 0,
    activeUsers: 0,
    monthlyRevenue: 0,
  });
  const [pipelineData, setPipelineData] = useState<PipelineItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [chartData, setChartData] = useState<{ revenue: any[], projectStatus: any[] }>({ revenue: [], projectStatus: [] });
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

        // Fetch charts data
        try {
          const chartsRes = await fetch(`/api/dashboard/charts?role=${user.role}`);
          if (chartsRes.ok) {
            const chartsData = await chartsRes.json();
            setChartData(chartsData);
          }
        } catch (e) {
          console.error('Error fetching charts data', e);
        }

        // Fetch recent customers
        const customersRes = await fetch('/api/customers?limit=5');
        const customersData = await customersRes.json();
        if (customersData.customers) {
          setRecentCustomers(customersData.customers);
        }

        // Fetch inventory data
        const inventoryRes = await fetch('/api/inventory/products');
        const inventoryData = await inventoryRes.json();

        // Transform inventory data for display
        if (Array.isArray(inventoryData) && inventoryData.length > 0) {
          const transformedInventory = inventoryData.slice(0, 5).map((item: any) => ({
            name: item.name,
            current: item.current_stock,
            total: item.minimum_stock * 5, // Example total
            reserved: 0,
            status: item.current_stock < item.minimum_stock ? 'low' : 'normal',
          }));
          setInventoryItems(transformedInventory);
        } else {
          setInventoryItems([]);
        }

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
          <h1 className="text-2xl font-bold text-on-surface">
            {user?.role === 'ADMIN' ? 'Admin Dashboard' : 
             user?.role === 'MARKETING' ? 'Marketing Dashboard' : 
             user?.role === 'INSTALLATION' ? 'Installation Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-on-surface-variant mt-1">Complete overview of your operations</p>
        </div>
        <div className="flex gap-3">
          {['ADMIN', 'MARKETING'].includes(user?.role) && (
            <Link href="/customers/new">
              <button className="px-4 py-2 bg-primary-container text-on-secondary-fixed font-label-bold rounded hover:bg-primary-fixed-dim transition-colors industrial-shadow flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                New Customer
              </button>
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link href="/users/new">
              <button className="px-4 py-2 border border-outline-variant bg-surface-container-lowest text-on-secondary-fixed font-label-bold rounded hover:bg-surface-container-low transition-colors industrial-shadow flex items-center gap-2">
                <span className="material-symbols-outlined">group_add</span>
                Add User
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* New Leads */}
        {['ADMIN', 'MARKETING'].includes(user?.role) && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-bold text-on-surface-variant">New Leads</span>
              <span className="material-symbols-outlined text-secondary">trending_up</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">{stats.newLeads}</div>
            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Last 7 days</div>
          </div>
        )}

        {/* Active Jobs */}
        {['ADMIN', 'INSTALLATION'].includes(user?.role) && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-bold text-on-surface-variant">Active Jobs</span>
              <span className="material-symbols-outlined text-primary-container">engineering</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">{stats.activeJobs}</div>
            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Across all districts</div>
          </div>
        )}

        {/* Installs This Month */}
        {['ADMIN', 'INSTALLATION'].includes(user?.role) && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-bold text-on-surface-variant">Installs This Month</span>
              <span className="material-symbols-outlined text-tertiary">check_circle</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">{stats.installsThisMonth}</div>
            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">This month</div>
          </div>
        )}

        {/* Pending DISCOM */}
        {['ADMIN', 'DISCOM'].includes(user?.role) && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 industrial-shadow">
            <div className="flex justify-between items-start mb-2">
              <span className="font-label-bold text-on-surface-variant">Pending DISCOM</span>
              <span className="material-symbols-outlined text-error">warning</span>
            </div>
            <div className="text-2xl font-bold text-on-surface">{stats.pendingDiscom}</div>
            <div className="mt-2 pt-2 border-t border-outline-variant/50 text-xs text-secondary">Requires action</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Visual Analytics */}
          {['ADMIN', 'MARKETING'].includes(user?.role) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
                <h3 className="text-xl font-bold text-on-surface mb-4">Revenue Overview (6 Months)</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.revenue}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                      <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `₹${value / 1000}k`} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--outline-variant)' }} />
                      <Bar dataKey="revenue" fill="var(--primary-container)" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
                <h3 className="text-xl font-bold text-on-surface mb-4">Active Project Status</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.projectStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.projectStatus.map((entry, index) => {
                          const colors = ['var(--primary-container)', 'var(--secondary)', 'var(--tertiary)', 'var(--error-container)', 'var(--outline-variant)'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--outline-variant)' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Project Pipeline */}
          {['ADMIN', 'MARKETING'].includes(user?.role) && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow flex flex-col">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
                <h3 className="text-xl font-bold text-on-surface">Project Pipeline</h3>
                <Link href="/projects" className="text-primary font-label-sm hover:underline">View All</Link>
              </div>
              <div className="flex-1 flex flex-col justify-center space-y-4">
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
          )}

        {/* Recent Customers */}
        {['ADMIN', 'MARKETING'].includes(user?.role) && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
              <h3 className="text-xl font-bold text-on-surface">Recent Customers</h3>
              <Link href="/customers" className="text-primary font-label-sm hover:underline">View All</Link>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-on-surface-variant uppercase bg-surface-container-low">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Name</th>
                    <th className="px-4 py-3">Mobile</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3 rounded-tr-lg text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.length > 0 ? recentCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors">
                      <td className="px-4 py-3 font-medium text-on-surface">
                        <Link href={`/customers/${customer.id}`} className="hover:text-primary transition-colors">
                          {customer.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-on-surface-variant">{customer.mobile}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{customer.city}</td>
                      <td className="px-4 py-3 text-on-surface-variant text-right">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">
                        No recent customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>        {/* Schedule & Inventory Column */}
        <div className="flex flex-col gap-6">
          {/* Today's Schedule */}
          {['ADMIN', 'INSTALLATION', 'DISCOM'].includes(user?.role) && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
                <h3 className="text-xl font-bold text-on-surface">Today's Schedule</h3>
                <Link href="/survey" className="text-primary font-label-sm hover:underline">View All</Link>
              </div>
              <div className="space-y-3">
                {['ADMIN', 'INSTALLATION'].includes(user?.role) && (
                  <>
                    <div className="flex justify-between items-center p-3 border border-outline-variant rounded bg-surface-bright">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="font-label-bold">Site Surveys</span>
                      </div>
                      <span className="font-mono px-2 py-1 bg-surface-container-low rounded">{stats.schedule?.surveys || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 border border-outline-variant rounded bg-surface-bright">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary-container"></div>
                        <span className="font-label-bold">Installations</span>
                      </div>
                      <span className="font-mono px-2 py-1 bg-surface-container-low rounded">{stats.schedule?.installations || 0}</span>
                    </div>
                  </>
                )}
                {['ADMIN', 'DISCOM'].includes(user?.role) && (
                  <div className="flex justify-between items-center p-3 border border-outline-variant rounded bg-surface-bright">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-error"></div>
                      <span className="font-label-bold">DISCOM Tasks</span>
                    </div>
                    <span className="font-mono px-2 py-1 bg-surface-container-low rounded">{stats.schedule?.discomTasks || 0}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Inventory Widget */}
          {['ADMIN', 'INSTALLATION'].includes(user?.role) && (
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-6 industrial-shadow flex-1">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant">
                <h3 className="text-xl font-bold text-on-surface">Inventory Status</h3>
                <Link href="/inventory" className="material-symbols-outlined text-secondary text-sm cursor-pointer hover:text-primary">
                  more_horiz
                </Link>
              </div>
              <div className="space-y-4">
                {inventoryItems.length > 0 ? inventoryItems.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-label-bold text-on-surface">{item.name}</span>
                      <span className={`font-mono ${item.status === 'low' ? 'text-error font-medium' : ''}`}>
                        {item.current} / {item.total}
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${item.status === 'low' ? 'bg-error' : 'bg-tertiary'}`}
                        style={{ width: `${(item.current / item.total) * 100}%` }}
                      ></div>
                    </div>
                    {item.reserved > 0 && (
                      <p className="text-xs text-secondary mt-1 text-right">{item.reserved} Reserved</p>
                    )}
                    {item.status === 'low' && (
                      <p className="text-xs text-error mt-1 text-right flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[14px]">warning</span> Low Stock
                      </p>
                    )}
                  </div>
                )) : (
                  <div className="text-center text-on-surface-variant py-4">No inventory data</div>
                )}
              </div>
            </div>
          )}
        </div>v>
      </div>
    </div>
  );
}
