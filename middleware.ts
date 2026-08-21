import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configure middleware to use Node.js runtime (required for mysql2/NextAuth)
export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/api/mobile', '/api/inventory/products'];

// Removed legacy workerRoutes

// Routes accessible by MARKETING
const marketingRoutes = [
  '/dashboard',
  '/customers',
  '/projects',
  '/quotations',
];

// Routes accessible by INSTALLATION
const installationRoutes = [
  '/dashboard',
  '/survey',
  '/inventory',
  '/installation',
  '/service',
];

// Routes accessible by DISCOM operators
const discomRoutes = [
  '/dashboard',
  '/discom',
  '/documents',
];

// Admin-only routes
const adminOnlyRoutes = [
  '/system-templates',
  '/users',
  '/reports',
  '/settings',
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    if (isLoggedIn && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // Not logged in -> Redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Admin has full access
  if (userRole === 'ADMIN') {
    return NextResponse.next();
  }

  // Check role-specific routes
  let hasAccess = false;
  if (userRole === 'MARKETING') {
    hasAccess = marketingRoutes.some((route) => pathname.startsWith(route));
  } else if (userRole === 'INSTALLATION') {
    hasAccess = installationRoutes.some((route) => pathname.startsWith(route));
  } else if (userRole === 'DISCOM') {
    hasAccess = discomRoutes.some((route) => pathname.startsWith(route));
  }

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
