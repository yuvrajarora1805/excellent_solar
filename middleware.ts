import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configure middleware to use Node.js runtime (required for mysql2/NextAuth)
export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/api/mobile', '/api/inventory/products'];

// Routes accessible by workers
const workerRoutes = [
  '/dashboard',
  '/projects',
  '/survey',
  '/installation',
  '/discom',
  '/documents',
];

// Routes accessible by DISCOM operators
const discomRoutes = [
  '/dashboard',
  '/discom',
  '/documents',
];

// Admin-only routes
const adminOnlyRoutes = [
  '/customers',
  '/inventory',
  '/users',
  '/reports',
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

  // Require authentication
  if (!isLoggedIn) {
    const signInUrl = new URL('/login', req.url);
    signInUrl.searchParams.set('callbackUrl', encodeURI(pathname));
    return NextResponse.redirect(signInUrl);
  }

  // Role-based access control
  if (userRole === 'WORKER') {
    const isWorkerRoute = workerRoutes.some((route) => pathname.startsWith(route));
    if (!isWorkerRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  } else if (userRole === 'DISCOM_OPERATOR') {
    const isDiscomRoute = discomRoutes.some((route) => pathname.startsWith(route));
    if (!isDiscomRoute) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
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
