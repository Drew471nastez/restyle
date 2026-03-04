'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Menu, X, Plus, Heart, User, MessageCircle, ShoppingBag } from 'lucide-react';
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
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Top bar - full width */}
        <div className="w-full border-b border-gray-100">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <div className="flex h-16 items-center gap-4">
              {/* Logo */}
              <Link href="/" className="shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-base">R</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block tracking-tight">ReStyle</span>
              </Link>

              {/* Desktop Search - wide and prominent */}
              <div className="hidden md:flex flex-1 max-w-2xl">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('common.search')}
                    className="w-full h-11 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Desktop Nav - right aligned */}
              <nav className="hidden md:flex items-center gap-1 ml-auto">
                {user ? (
                  <>
                    <Link
                      href="/app/sell"
                      className="inline-flex items-center gap-2 h-10 px-5 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition shadow-sm"
                    >
                      <Plus className="h-4 w-4" />
                      {t('common.sell')}
                    </Link>
                    <Link
                      href="/app/favorites"
                      className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Favorites"
                    >
                      <Heart className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/app/messages"
                      className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Messages"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/app/profile"
                      className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Profile"
                    >
                      <User className="h-5 w-5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="h-10 px-5 flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition"
                    >
                      {t('common.login')}
                    </Link>
                    <Link
                      href="/signup"
                      className="h-10 px-5 flex items-center bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition shadow-sm"
                    >
                      {t('common.signup')}
                    </Link>
                  </>
                )}
              </nav>

              {/* Mobile Actions */}
              <div className="flex items-center gap-0.5 ml-auto md:hidden">
                <button
                  onClick={() => { setSearchOpen(!searchOpen); setMobileMenuOpen(false); }}
                  className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  <Search className="h-5 w-5" />
                </button>
                {user ? (
                  <Link
                    href="/app/sell"
                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-teal-500 text-white"
                  >
                    <Plus className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="h-10 px-4 flex items-center bg-teal-500 text-white rounded-lg text-sm font-semibold"
                  >
                    {t('common.login')}
                  </Link>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setSearchOpen(false); }}
                  className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Category Nav */}
        <div className="hidden md:block w-full bg-white border-b border-gray-100">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <nav className="flex items-center gap-1 h-11 overflow-x-auto no-scrollbar">
              {[
                { href: '/browse?category=women', label: t('categories.women') },
                { href: '/browse?category=men', label: t('categories.men') },
                { href: '/browse?category=kids', label: t('categories.kids') },
                { href: '/browse?category=shoes', label: t('categories.shoes') },
                { href: '/browse?category=bags', label: t('categories.bags') },
                { href: '/browse?category=accessories', label: t('categories.accessories') },
              ].map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="shrink-0 px-4 h-full flex items-center text-sm text-gray-600 hover:text-teal-600 hover:border-b-2 hover:border-teal-500 transition-colors font-medium"
                >
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        {searchOpen && (
          <div className="border-t border-gray-100 px-4 py-3 md:hidden bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                autoFocus
                className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
        )}

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 md:hidden bg-white">
            <nav className="px-4 py-3 space-y-0.5">
              {/* Category links */}
              <p className="px-3 pt-1 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categories</p>
              {[
                { href: '/browse?category=women', label: t('categories.women') },
                { href: '/browse?category=men', label: t('categories.men') },
                { href: '/browse?category=kids', label: t('categories.kids') },
                { href: '/browse?category=shoes', label: t('categories.shoes') },
                { href: '/browse?category=bags', label: t('categories.bags') },
                { href: '/browse?category=accessories', label: t('categories.accessories') },
              ].map((cat) => (
                <Link key={cat.href} href={cat.href} onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  {cat.label}
                </Link>
              ))}

              <div className="my-2 border-t border-gray-100" />

              {user ? (
                <>
                  <Link href="/app" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-gray-400" /> Dashboard
                  </Link>
                  <Link href="/app/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-gray-400" /> {t('nav.orders')}
                  </Link>
                  <Link href="/app/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-gray-400" /> {t('nav.messages')}
                  </Link>
                  <Link href="/app/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" /> {t('nav.profile')}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    {t('common.login')}
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-semibold text-teal-600 hover:bg-teal-50 rounded-lg">
                    {t('common.signup')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
