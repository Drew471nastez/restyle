import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication (after locale prefix)
const PROTECTED_PATHS = [
  '/app',
  '/checkout',
  '/admin',
];

function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix if present
  const pathWithoutLocale = pathname.replace(/^\/(en|ro)/, '') || '/';
  return PROTECTED_PATHS.some(p => pathWithoutLocale.startsWith(p));
}

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Check auth for protected routes
  if (isProtectedPath(pathname)) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // For as-needed mode: only add locale prefix for non-default locale
      const isRomanian = pathname.startsWith('/ro');
      const loginPath = isRomanian ? '/ro/login' : '/login';
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|ro)/:path*', '/((?!api|_next|_vercel|.*\\..*).+)'],
};
