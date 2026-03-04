'use client';

import { Settings } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';

export function AppTopBar() {
  const pathname = usePathname();

  // Derive title from path
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'dashboard';
  const title = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 md:border-none">
      <div className="mx-auto max-w-7xl px-4 flex h-14 items-center justify-between">
        {/* Logo for desktop */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-bold text-gray-900">ReStyle</span>
          </Link>
        </div>

        {/* Mobile title */}
        <h1 className="text-base font-semibold text-gray-900 md:hidden">{title}</h1>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/app" pathname={pathname}>Dashboard</NavLink>
          <NavLink href="/app/sell" pathname={pathname}>Sell</NavLink>
          <NavLink href="/app/listings" pathname={pathname}>Listings</NavLink>
          <NavLink href="/app/orders" pathname={pathname}>Orders</NavLink>
          <NavLink href="/app/messages" pathname={pathname}>Messages</NavLink>
          <NavLink href="/app/wallet" pathname={pathname}>Wallet</NavLink>
          <NavLink href="/app/favorites" pathname={pathname}>Favorites</NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/app/profile"
            className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
          >
            <Settings className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, pathname, children }: { href: string; pathname: string; children: React.ReactNode }) {
  const isActive = pathname === href || (href !== '/app' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition ${isActive ? 'text-teal-600' : 'text-gray-500 hover:text-gray-900'}`}
    >
      {children}
    </Link>
  );
}
