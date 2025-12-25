import { withAuth } from 'next-auth/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Coming Soon Mode - set to false to disable splash page redirect
const COMING_SOON_MODE = true;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Routes that require Supabase Auth (user accounts)
const userProtectedRoutes = ['/dashboard', '/profile', '/settings', '/my-audits'];

// Check if path matches any protected user routes
function isUserProtectedRoute(pathname: string) {
  return userProtectedRoutes.some(route => pathname.startsWith(route));
}

// Supabase Auth middleware for user routes
async function handleSupabaseAuth(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // If no user and trying to access protected route, redirect to login
  if (!user && isUserProtectedRoute(request.nextUrl.pathname)) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is logged in and trying to access login/signup, redirect to dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

// NextAuth middleware for admin routes
const nextAuthMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isLoginPage = req.nextUrl.pathname === '/admin/login';

    if (isLoginPage) {
      if (token?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.next();
    }

    if (token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/login') {
          return true;
        }
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle admin routes with NextAuth
  if (pathname.startsWith('/admin')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (nextAuthMiddleware as any)(request);
  }

  // Coming Soon Mode: redirect all public routes to /coming-soon
  if (COMING_SOON_MODE) {
    // Allow these paths through without redirect
    const allowedPaths = [
      '/coming-soon',
      '/api/',
      '/_next/',
      '/favicon.ico',
    ];

    const isAllowed = allowedPaths.some(path => pathname.startsWith(path)) ||
                      pathname === '/coming-soon';

    if (!isAllowed) {
      return NextResponse.redirect(new URL('/coming-soon', request.url));
    }
  }

  // Handle user routes with Supabase Auth
  if (isUserProtectedRoute(pathname) || pathname === '/login' || pathname === '/signup') {
    return handleSupabaseAuth(request);
  }

  // Refresh Supabase session for all other routes
  return handleSupabaseAuth(request);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/my-audits/:path*',
    '/login',
    '/signup',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
