'use client';

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
    title: 'Purchases',
    description: 'Manage supplier purchases and invoices',
    icon: 'shopping_cart',
    href: '/inventory/purchases',
    color: 'bg-tertiary-container',
    stats: 'View purchases',
  },
  {
    title: 'Reservations',
    description: 'View and manage inventory reservations',
    icon: 'bookmark',
    href: '/inventory/reservations',
    color: 'bg-error-container',
    stats: 'View reservations',
  },
];

export default function InventoryPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">Inventory Management</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Manage products, stock, purchases, and reservations
        </p>
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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Total Products</div>
          <div className="text-headline-md font-bold text-on-surface">0</div>
          <p className="text-label-sm text-secondary mt-1">Active items in catalog</p>
        </div>
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Low Stock Items</div>
          <div className="text-headline-md font-bold text-primary-container">0</div>
          <p className="text-label-sm text-error mt-1">Need attention</p>
        </div>
        <div className="card-base p-4">
          <div className="font-label-bold text-on-surface-variant mb-2">Pending Purchases</div>
          <div className="text-headline-md font-bold text-on-surface">0</div>
          <p className="text-label-sm text-secondary mt-1">Orders in progress</p>
        </div>
      </div>
    </div>
  );
}
