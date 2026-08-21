'use client';

import { auth } from '@/lib/auth/config';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// Navigation items with Material Icons
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard', roles: ['ADMIN', 'WORKER', 'DISCOM_OPERATOR'] },
  { name: 'Customers', href: '/customers', icon: 'groups', roles: ['ADMIN'] },
  { name: 'Projects', href: '/projects', icon: 'folder_open', roles: ['ADMIN', 'WORKER'] },
  { name: 'Quotations', href: '/quotations', icon: 'description', roles: ['ADMIN'] },
  { name: 'Inventory', href: '/inventory', icon: 'inventory_2', roles: ['ADMIN'] },
  { name: 'Site Survey', href: '/survey', icon: 'assignment_turned_in', roles: ['ADMIN', 'WORKER'] },
  { name: 'Installation', href: '/installation', icon: 'engineering', roles: ['ADMIN', 'WORKER'] },
  { name: 'DISCOM', href: '/discom', icon: 'account_balance', roles: ['ADMIN', 'DISCOM_OPERATOR'] },
  { name: 'Service', href: '/service', icon: 'support_agent', roles: ['ADMIN', 'WORKER'] },
  { name: 'System Templates', href: '/system-templates', icon: 'settings', roles: ['ADMIN'] },
  { name: 'Reports', href: '/reports', icon: 'bar_chart', roles: ['ADMIN', 'DISCOM_OPERATOR'] },
  { name: 'Users', href: '/users', icon: 'people', roles: ['ADMIN'] },
  { name: 'Settings', href: '/settings', icon: 'settings_applications', roles: ['ADMIN'] },
];

// Material Icon component
const MaterialIcon = ({ name, filled = false, className = '' }: { name: string; filled?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={filled ? { fontVariationSettings: 'FILL 1' } : undefined}
  >
    {name}
  </span>
);

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // This would come from session in a real app
  const user = { name: 'Admin User', email: 'admin@excellentsolar.com', role: 'ADMIN' };

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className="hidden md:flex bg-[#0f172a] fixed left-0 top-0 h-full w-[280px] border-r border-slate-800 flex-col py-8 z-20 md:translate-x-0"
      >
        {/* Logo */}
        <div className="px-8 mb-8 mt-2">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Excellent Solar Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">Excellent Solar</span>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded font-label-bold transition-colors ${
                    isActive
                      ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500 scale-[0.98]'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <MaterialIcon name={item.icon} filled={isActive} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User menu */}
        <div className="px-4 mt-auto pt-4 border-t border-slate-800 space-y-1">
          <div className="flex items-center gap-3 p-3 rounded bg-slate-900 border border-slate-800">
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded text-slate-400 font-label-bold hover:bg-white/10 hover:text-white transition-colors w-full"
          >
            <MaterialIcon name="logout" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-[280px] bg-[#0f172a] border-r border-slate-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-800 bg-[#0b0f19]">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src="/logo.png" alt="Excellent Solar Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg text-white">Excellent Solar</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <MaterialIcon name="close" className="text-slate-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded font-label-bold transition-colors ${
                      isActive
                        ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <MaterialIcon name={item.icon} filled={isActive} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="px-4 py-4 border-t border-slate-800 bg-[#0b0f19]">
            <div className="flex items-center gap-3 mb-4 p-3 rounded bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-white border-slate-800 hover:bg-white/10"
              onClick={handleLogout}
            >
              <MaterialIcon name="logout" className="mr-2 text-slate-400" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-[280px] h-screen bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-surface-bright border-b border-outline-variant flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-surface-container transition-colors"
            >
              <MaterialIcon name="menu" className="text-on-surface-variant" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <MaterialIcon name="solar_power" filled className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-on-surface">Excellent Solar</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container">
              <div className="w-2 h-2 rounded-full bg-tertiary-container"></div>
              <span className="text-sm font-medium text-on-surface">
                {user.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page content with proper spacing - THIS IS THE KEY FIX */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="page-transition">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-outline-variant bg-surface-bright py-4 px-4 lg:px-8 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-on-surface-variant">
            <p>© 2025 Excellent Solar. All rights reserved.</p>
            <p>Solar Project Management System v1.0</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
