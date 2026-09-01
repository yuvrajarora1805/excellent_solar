import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import jwt from 'jsonwebtoken';

// Configure middleware to use Node.js runtime (required for mysql2/NextAuth)
export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth',
  '/api/mobile/auth/login',
  '/api/mobile/login',
  '/api/mobile/app-version',
  '/downloads',
];




const marketingRoutes: string[] = [
  '/dashboard',
  '/customers',
  '/projects',
  '/quotations',
  '/survey',
  '/inventory',
  '/orders',
];

const installationRoutes: string[] = [
  '/dashboard',
  '/inventory',
  '/installation',
  '/service',
  '/serial-numbers',
];

const discomRoutes: string[] = [
  '/dashboard',
  '/discom',
  '/documents',
];

const surveyViewerRoutes: string[] = [
  '/dashboard',
  '/site-documents',
  '/survey',
  '/installation',
  '/documents',
  '/discom',
];

const orderManagerRoutes: string[] = [
  '/dashboard',
  '/orders',
  '/inventory',
  '/api/mobile/customers',
  '/api/mobile/projects',
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

  // Handle all API routes (/api/...)
  if (pathname.startsWith('/api/')) {
    let apiUserRole = req.auth?.user?.role;
    
    // Check for Mobile Bearer JWT token if no Web Session
    if (!apiUserRole) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback_secret_for_development';
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          apiUserRole = decoded.role;
        } catch (error) {
          return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }
      }
    }

    if (!apiUserRole) {
      return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
    }

    // Role-based access control for API routes
    if (apiUserRole === 'ADMIN') {
      return NextResponse.next();
    }

    let hasApiAccess = false;
    
    // Check if the API route starts with one of the allowed page routes
    if (apiUserRole === 'MARKETING') {
      hasApiAccess = marketingRoutes.some((route) => pathname.startsWith(`/api${route}`));
    } else if (apiUserRole === 'INSTALLATION') {
      hasApiAccess = installationRoutes.some((route) => pathname.startsWith(`/api${route}`));
    } else if (apiUserRole === 'DISCOM') {
      hasApiAccess = discomRoutes.some((route) => pathname.startsWith(`/api${route}`));
    } else if (apiUserRole === 'SURVEY_VIEWER') {
      hasApiAccess = surveyViewerRoutes.some((route) => pathname.startsWith(`/api${route}`));
    } else if (apiUserRole === 'ORDER_MANAGER') {
      hasApiAccess = orderManagerRoutes.some((route) => pathname.startsWith(`/api${route}`) || pathname.startsWith(route));
      // orderManagerRoutes has '/inventory', so pathname.startsWith('/api/inventory') matches
      // But wait, the standard map uses `/api${route}`. I will use `/api${route}`
      hasApiAccess = orderManagerRoutes.some((route) => pathname.startsWith(route.startsWith('/api') ? route : `/api${route}`));
    }

    // Common APIs accessible to any authenticated user
    if (pathname.startsWith('/api/dashboard') || pathname.startsWith('/api/profile') || pathname.startsWith('/api/mobile')) {
      hasApiAccess = true;
    }

    if (!hasApiAccess) {
      return NextResponse.json({ error: 'Forbidden: Insufficient role permissions' }, { status: 403 });
    }

    return NextResponse.next();
  }

  // Not logged in web pages -> Redirect to login
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
  } else if (userRole === 'SURVEY_VIEWER') {
    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/site-documents', req.url));
    }
    hasAccess = surveyViewerRoutes.some((route) => pathname.startsWith(route));
  } else if (userRole === 'ORDER_MANAGER') {
    hasAccess = orderManagerRoutes.some((route) => pathname.startsWith(route));
  }

  if (!hasAccess) {
    return NextResponse.redirect(userRole === 'SURVEY_VIEWER' ? new URL('/site-documents', req.url) : new URL('/dashboard', req.url));
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk|pdf)$).*)',
  ],
};

