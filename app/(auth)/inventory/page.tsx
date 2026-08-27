'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const inventorySections = [
  {
    title: 'Products',
    description: 'Manage product catalog, pricing, and specifications',
    icon: 'inventory_2',
    href: '/inventory/products',
    color: 'bg-primary-container',
    stats: 'View all products',
  },
  {
    title: 'Stock',
    description: 'Monitor stock levels, transactions, and adjustments',
    icon: 'bar_chart',
    href: '/inventory/stock',
    color: 'bg-secondary-container',
    stats: 'Check stock status',
  },
  {
    title: 'Flasher Reports & Panels',
    description: 'View Waaree flasher test details, OA No., Box No., and unique serial numbers',
    icon: 'solar_power',
    href: '/inventory/flasher-reports',
    color: 'bg-emerald-100 text-emerald-900',
    stats: 'Manage Flasher Reports & Serials',
  },
  {
    title: 'Reservations & Requests',
    description: 'Manage material reservations and project stock requests',
    icon: 'assignment',
    href: '/inventory/reservations',
    color: 'bg-amber-100 text-amber-900',
    stats: 'View Reservations & Requests',
  },
  {
    title: 'Purchases',
    description: 'Manage supplier purchases and invoices',
    icon: 'shopping_cart',
    href: '/inventory/purchases',
    color: 'bg-tertiary-container',
    stats: 'View purchases',
  },
];


export default function InventoryPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalSerials: 0,
    pendingPurchases: 0,
    totalOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/inventory/stats');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch inventory stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Inventory Management</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Manage products, stock, flasher reports, and purchases
        </p>
      </div>

      {/* Real-time Dynamic Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Total Products</div>
          <div className="text-headline-md font-bold text-on-surface">
            {loading ? '...' : stats.totalProducts}
          </div>
          <p className="text-label-sm text-secondary mt-1">Active items in catalog</p>
        </div>
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Total Stock & Panels</div>
          <div className="text-headline-md font-bold text-emerald-600">
            {loading ? '...' : stats.totalStock}
          </div>
          <p className="text-label-sm text-secondary mt-1">Units available in warehouse</p>
        </div>
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Pending Purchases</div>
          <div className="text-headline-md font-bold text-amber-600">
            {loading ? '...' : stats.pendingPurchases}
          </div>
          <p className="text-label-sm text-secondary mt-1">Purchase orders in progress</p>
        </div>
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Total Dispatches & Orders</div>
          <div className="text-headline-md font-bold text-blue-600">
            {loading ? '...' : stats.totalOrders}
          </div>
          <p className="text-label-sm text-secondary mt-1">Orders dispatched to customers</p>
        </div>
      </div>

      {/* Inventory Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {inventorySections.map((section) => (
          <div key={section.href} className="card-base p-6 hover:border-primary-container transition-colors">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <span className="material-symbols-outlined text-on-primary-container text-2xl">{section.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-headline-sm font-semibold text-on-surface">{section.title}</h3>
                <p className="text-body-md text-on-surface-variant mt-1">{section.description}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href={section.href}>
                <button className="btn-outline w-full justify-start flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  {section.stats}
                </button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
