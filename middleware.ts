import { auth } from '@/lib/auth/config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import jwt from 'jsonwebtoken';

// Configure middleware to use Node.js runtime (required for mysql2/NextAuth)
export const runtime = 'nodejs';

// Routes that don't require authentication
const publicRoutes = ['/login', '/api/auth', '/api/mobile/auth/login', '/api/mobile/app-version', '/downloads', '/api/ocr'];


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
    // 1. Allow authenticated Web Session (NextAuth)
    if (isLoggedIn) {
      return NextResponse.next();
    }

    // 2. Allow requests with valid Mobile Bearer JWT token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'fallback_secret_for_development';
        jwt.verify(token, JWT_SECRET);
        return NextResponse.next();
      } catch (error) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Unauthorized: Access denied' }, { status: 401 });
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk|pdf)$).*)',
  ],
};

