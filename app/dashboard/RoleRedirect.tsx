'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Role-based dashboard routing
const roleRoutes: Record<string, string> = {
  ADMIN: '/dashboard',
  SALES: '/dashboard/sales',
  WORKER: '/dashboard/worker',
  DISCOM_OPERATOR: '/dashboard/discom',
};

interface RoleRedirectProps {
  userRole: string;
  userId?: string;
}

export function RoleRedirect({ userRole, userId }: RoleRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If user is on the main dashboard but their role has a specific dashboard
    if (pathname === '/dashboard' && roleRoutes[userRole] && roleRoutes[userRole] !== '/dashboard') {
      router.replace(roleRoutes[userRole]);
    }
  }, [userRole, pathname, router]);

  return null;
}

// Get the appropriate dashboard route for a role
export function getDashboardForRole(role: string): string {
  return roleRoutes[role] || '/dashboard';
}

// Check if a route is accessible for a role
export function isRouteAccessible(route: string, role: string): boolean {
  // Admin can access everything
  if (role === 'ADMIN') return true;

  // Sales staff can access sales dashboard
  if (role === 'SALES' && route.startsWith('/dashboard/sales')) return true;
  if (role === 'SALES' && (route.startsWith('/customers') || route.startsWith('/quotations') || route.startsWith('/projects'))) return true;

  // Workers can access worker dashboard
  if (role === 'WORKER' && route.startsWith('/dashboard/worker')) return true;
  if (role === 'WORKER' && (route.startsWith('/survey') || route.startsWith('/installation') || route.startsWith('/service'))) return true;

  // DISCOM operators can access DISCOM dashboard
  if (role === 'DISCOM_OPERATOR' && route.startsWith('/dashboard/discom')) return true;
  if (role === 'DISCOM_OPERATOR' && route.startsWith('/discom')) return true;

  return false;
}
