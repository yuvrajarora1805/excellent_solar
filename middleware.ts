import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import jwt from 'jsonwebtoken';

// Configure middleware to use Node.js runtime (required for mysql2/NextAuth)
export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/api/mobile/auth/login'];

// Routes that require JWT API Key for Mobile App
const mobileApiRoutes = ['/api/mobile', '/api/inventory/products'];

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

  // Check if route is mobile API (Requires Bearer Token or Web Session)
  const isMobileApi = mobileApiRoutes.some((route) => pathname.startsWith(route));

  if (isMobileApi) {
    // Allow logged in web dashboard users
    if (isLoggedIn) {
      return NextResponse.next();
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback_secret_for_development';
      jwt.verify(token, JWT_SECRET);
      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
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
