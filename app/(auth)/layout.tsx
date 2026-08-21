'use client';

import { auth } from '@/lib/auth/config';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['ADMIN', 'MARKETING', 'INSTALLATION', 'DISCOM'] },
  { name: 'Customers', href: '/customers', icon: 'groups', roles: ['ADMIN', 'MARKETING'] },
  { name: 'Site Survey', href: '/survey', icon: 'assignment_turned_in', roles: ['ADMIN', 'INSTALLATION'] },
  { name: 'Projects', href: '/projects', icon: 'folder_open', roles: ['ADMIN', 'MARKETING'] },
  { name: 'Quotations', href: '/quotations', icon: 'description', roles: ['ADMIN', 'MARKETING'] },
  { name: 'DISCOM', href: '/discom', icon: 'account_balance', roles: ['ADMIN', 'DISCOM'] },
  { name: 'Inventory', href: '/inventory', icon: 'inventory_2', roles: ['ADMIN', 'INSTALLATION'] },
  { name: 'Installation', href: '/installation', icon: 'engineering', roles: ['ADMIN', 'INSTALLATION'] },
  { name: 'Service', href: '/service', icon: 'support_agent', roles: ['ADMIN', 'INSTALLATION'] },
  { name: 'System Templates', href: '/system-templates', icon: 'settings', roles: ['ADMIN'] },
  { name: 'Reports', href: '/reports', icon: 'bar_chart', roles: ['ADMIN', 'DISCOM', 'MARKETING'] },
  { name: 'Users', href: '/users', icon: 'people', roles: ['ADMIN'] },
  { name: 'Settings', href: '/settings', icon: 'settings_applications', roles: ['ADMIN'] },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const { data: session } = useSession();
  const user = session?.user || { name: 'Loading', email: '', role: 'ADMIN', id: 0 };

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      <div className="app-shell">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* =========================================================
            SIDEBAR
        ========================================================== */}
        <aside className="app-sidebar flex w-[280px] min-w-0 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-800 bg-[#0f172a]">
          {/* Logo/Brand */}
          <div className="flex shrink-0 flex-col px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                <img src="/logo.png" alt="Excellent Solar Logo" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-white">
                  Excellent Solar
                </h1>

                <p className="truncate text-xs text-slate-400">
                  Project Management System
                </p>
              </div>
            </div>
          </div>

          {/* CTA Button - Role-specific */}
          <div className="px-3 pb-4">
            {user.role === 'ADMIN' && (
              <Link
                href="/projects/new"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                <span>New Project</span>
              </Link>
            )}
            {user.role === 'MARKETING' && (
              <Link
                href="/customers/new"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                <span>New Customer</span>
              </Link>
            )}
            {user.role === 'INSTALLATION' && (
              <Link
                href="/survey"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  playlist_add_check
                </span>
                <span>My Jobs</span>
              </Link>
            )}
            {user.role === 'DISCOM' && (
              <Link
                href="/discom/new"
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add
                </span>
                <span>New Application</span>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
            <div className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex h-12 min-w-0 items-center gap-4 rounded-lg px-3 transition-colors ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 font-semibold border-l-4 border-emerald-500'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`material-symbols-outlined h-6 w-6 shrink-0 text-[24px] ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}`}>
                      {item.icon}
                    </span>

                    <span className="min-w-0 truncate text-sm font-medium">
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User */}
          <div className="shrink-0 border-t border-slate-800 p-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-900 border border-slate-800 p-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-bold">
                <span className="text-lg font-semibold uppercase">
                  {user.name?.charAt(0) || 'U'}
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {user.name}
                </p>

                <p className="truncate text-xs text-slate-400">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-2 flex h-11 w-full items-center gap-4 rounded-lg px-3 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="material-symbols-outlined h-6 w-6 shrink-0">
                logout
              </span>

              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* =====================================================
            MAIN AREA
        ====================================================== */}
        <div className="app-main-wrapper">
          {/* Header */}
          <header className="app-header flex items-center justify-end px-6">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-gray-800">
                {user.role}
              </span>
            </div>
          </header>

          {/* Page */}
          <main className="app-content">
            {children}
          </main>

          {/* Footer */}
          <footer className="app-footer flex items-center justify-between px-6 border-t border-slate-200 mt-auto py-4 bg-white">
            <p className="text-sm text-gray-600">
              © 2026 Excellent Solar. All rights reserved.
            </p>

            <p className="text-sm text-gray-600 font-medium">
              Made by OMVKY PVT LTD
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
