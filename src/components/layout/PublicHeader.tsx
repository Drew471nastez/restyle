'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Menu, X, Plus, Heart, User } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useUser } from '@/hooks/useUser';

export function PublicHeader() {
  const t = useTranslations();
  const { user } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Hide on app routes (they have their own layout)
  if (pathname.startsWith('/app') || pathname.startsWith('/admin')) return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-14 items-center gap-3">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center gap-1.5">
              <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-lg font-bold text-gray-900 hidden sm:block">ReStyle</span>
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {user ? (
                <>
                  <Link
                    href="/app/sell"
                    className="inline-flex items-center gap-1.5 h-9 px-4 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition"
                  >
                    <Plus className="h-4 w-4" />
                    {t('common.sell')}
                  </Link>
                  <Link
                    href="/app/favorites"
                    className="h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition"
                  >
                    <Heart className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/app/profile"
                    className="h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 transition"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="h-9 px-4 flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                  >
                    {t('common.login')}
                  </Link>
                  <Link
                    href="/signup"
                    className="h-9 px-4 flex items-center bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition"
                  >
                    {t('common.signup')}
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 ml-auto md:hidden">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                <Search className="h-5 w-5" />
              </button>
              {user ? (
                <Link
                  href="/app/sell"
                  className="h-9 w-9 flex items-center justify-center rounded-full bg-teal-500 text-white"
                >
                  <Plus className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="h-9 px-3 flex items-center bg-teal-500 text-white rounded-full text-sm font-medium"
                >
                  {t('common.login')}
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-9 w-9 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        {searchOpen && (
          <div className="border-t border-gray-100 px-4 py-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                autoFocus
                className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 md:hidden">
            <nav className="px-4 py-3 space-y-1">
              <Link href="/browse" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                {t('nav.browse')}
              </Link>
              <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                How it works
              </Link>
              {user ? (
                <>
                  <Link href="/app" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    Dashboard
                  </Link>
                  <Link href="/app/orders" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    {t('nav.orders')}
                  </Link>
                  <Link href="/app/messages" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    {t('nav.messages')}
                  </Link>
                </>
              ) : (
                <>
                  <div className="pt-2 border-t border-gray-100 mt-2">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                      {t('common.login')}
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-lg">
                      {t('common.signup')}
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
