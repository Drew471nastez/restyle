'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search, Menu, X, Plus, Heart, User, MessageCircle,
  Settings, Wallet, ShoppingBag, LogOut, Bell, ChevronDown,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useUser } from '@/hooks/useUser';
import { signOut } from '@/actions/auth';

export function PublicHeader() {
  const t = useTranslations();
  const { user, profile } = useUser();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide on admin routes (must be after all hooks)
  if (pathname.startsWith('/admin')) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      window.location.href = `/browse?q=${encodeURIComponent(trimmed)}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="w-full border-b border-gray-100">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <div className="flex h-14 items-center gap-4">
              <Link href="/" className="shrink-0 flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-base">R</span>
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block tracking-tight">ReStyle</span>
              </Link>

              <div className="hidden md:flex flex-1 max-w-2xl">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('common.search')}
                    className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition"
                  />
                </form>
              </div>

              <nav className="hidden md:flex items-center gap-1 ml-auto">
                {user ? (
                  <>
                    <Link
                      href="/sell"
                      className="inline-flex items-center gap-2 h-9 px-4 bg-violet-500 text-white rounded-lg text-sm font-semibold hover:bg-violet-600 transition"
                    >
                      <Plus className="h-4 w-4" />
                      Upload
                    </Link>
                    <Link
                      href="/favorites"
                      className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Favorites"
                    >
                      <Heart className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/messages"
                      className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Messages"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Link>
                    <button
                      className="relative h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
                      title="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                    </button>

                    <div className="relative ml-1" ref={userMenuRef}>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-lg hover:bg-gray-100 transition"
                      >
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-violet-600" />
                          </div>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                          <div className="px-4 py-2.5 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900">{profile?.display_name || profile?.username || 'User'}</p>
                            <p className="text-xs text-gray-500">@{profile?.username || 'user'}</p>
                          </div>

                          <div className="py-1">
                            <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                              <User className="h-4 w-4 text-gray-400" /> Profile
                            </Link>
                            <Link href="/favorites" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                              <Heart className="h-4 w-4 text-gray-400" /> Favorites
                            </Link>
                            <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                              <ShoppingBag className="h-4 w-4 text-gray-400" /> My orders
                            </Link>
                            <Link href="/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                              <Wallet className="h-4 w-4 text-gray-400" /> Wallet
                            </Link>
                          </div>

                          <div className="border-t border-gray-100 py-1">
                            <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                              <Settings className="h-4 w-4 text-gray-400" /> Settings
                            </Link>
                          </div>

                          <div className="border-t border-gray-100 py-1">
                            <form action={signOut}>
                              <button type="submit" className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                                <LogOut className="h-4 w-4" /> Log out
                              </button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="h-9 px-4 flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition">
                      {t('common.login')}
                    </Link>
                    <Link href="/signup" className="h-9 px-4 flex items-center bg-violet-500 text-white rounded-lg text-sm font-semibold hover:bg-violet-600 transition">
                      {t('common.signup')}
                    </Link>
                  </>
                )}
              </nav>

              <div className="flex items-center gap-0.5 ml-auto md:hidden">
                <button onClick={() => { setSearchOpen(!searchOpen); setMobileMenuOpen(false); }} className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
                  <Search className="h-5 w-5" />
                </button>
                {user ? (
                  <Link href="/sell" className="h-9 w-9 flex items-center justify-center rounded-lg bg-violet-500 text-white">
                    <Plus className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link href="/login" className="h-9 px-3 flex items-center bg-violet-500 text-white rounded-lg text-sm font-semibold">
                    {t('common.login')}
                  </Link>
                )}
                <button onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setSearchOpen(false); }} className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:block w-full bg-white border-b border-gray-100">
          <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
            <nav className="flex items-center gap-1 h-10 overflow-x-auto no-scrollbar">
              {[
                { href: '/browse?category=women', label: t('categories.women') },
                { href: '/browse?category=men', label: t('categories.men') },
                { href: '/browse?category=kids', label: t('categories.kids') },
                { href: '/browse?category=shoes', label: t('categories.shoes') },
                { href: '/browse?category=bags', label: t('categories.bags') },
                { href: '/browse?category=accessories', label: t('categories.accessories') },
              ].map((cat) => (
                <Link key={cat.href} href={cat.href} className="shrink-0 px-3 h-full flex items-center text-sm text-gray-600 hover:text-violet-600 hover:border-b-2 hover:border-violet-500 transition-colors font-medium">
                  {cat.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-gray-100 px-4 py-3 md:hidden bg-white">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common.search')} autoFocus className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
            </form>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 md:hidden bg-white">
            <nav className="px-4 py-3 space-y-0.5">
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
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400" /> Profile
                  </Link>
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-gray-400" /> My orders
                  </Link>
                  <Link href="/messages" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-gray-400" /> Messages
                  </Link>
                  <Link href="/wallet" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <Wallet className="h-4 w-4 text-gray-400" /> Wallet
                  </Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <Settings className="h-4 w-4 text-gray-400" /> Settings
                  </Link>
                  <div className="my-2 border-t border-gray-100" />
                  <form action={signOut}>
                    <button type="submit" className="flex items-center gap-3 w-full py-2.5 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    {t('common.login')}
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="block py-2.5 px-3 text-sm font-semibold text-violet-600 hover:bg-violet-50 rounded-lg">
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
