import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Routes that require authentication (after locale prefix)
const PROTECTED_PATHS = [
  '/checkout',
  '/admin',
  '/settings',
  '/profile',
  '/favorites',
  '/listings',
  '/orders',
  '/messages',
  '/wallet',
  '/sell',
  '/onboarding',
];

function isProtectedPath(pathname: string): boolean {
  // Strip locale prefix if present
  const pathWithoutLocale = pathname.replace(/^\/(en|ro)/, '') || '/';
  return PROTECTED_PATHS.some(p => pathWithoutLocale.startsWith(p));
}

// Public profile paths like /profile/username should NOT be protected
function isPublicProfilePath(pathname: string): boolean {
  const pathWithoutLocale = pathname.replace(/^\/(en|ro)/, '') || '/';
  return /^\/profile\/[^/]+/.test(pathWithoutLocale);
}

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static files
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Public profile pages are not protected
  if (isPublicProfilePath(pathname)) {
    return intlMiddleware(request);
  }

  // Check auth for protected routes
  if (isProtectedPath(pathname)) {
    const tempResponse = NextResponse.next();
    const cookiesToForward: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

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
              cookiesToForward.push({ name, value, options });
              request.cookies.set(name, value);
              tempResponse.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const isRomanian = pathname.startsWith('/ro');
      const loginPath = isRomanian ? '/ro/login' : '/login';
      const loginUrl = new URL(loginPath, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated - run intlMiddleware and forward auth cookies
    const intlResponse = intlMiddleware(request);
    cookiesToForward.forEach(({ name, value, options }) => {
      intlResponse.cookies.set(name, value, options);
    });
    return intlResponse;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|ro)/:path*', '/((?!api|_next|_vercel|.*\\..*).+)'],
};
