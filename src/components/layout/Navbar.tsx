'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  Heart,
  MessageCircle,
  Plus,
  User,
  ShoppingBag,
  LogOut,
  Settings,
  Package,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBar } from './SearchBar';

export function Navbar() {
  const t = useTranslations('nav');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5"
        >
          <ShoppingBag className="h-6 w-6 text-green-600" />
          <span className="text-xl font-bold text-green-600">
            ReStyle
          </span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 md:block">
          <SearchBar
            className="mx-auto max-w-xl"
            placeholder={t('searchPlaceholder')}
          />
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-1 md:flex">
          <Button asChild variant="default" size="sm" className="gap-1.5">
            <Link href="/sell">
              <Plus className="h-4 w-4" />
              {t('sell')}
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/favorites" aria-label={t('favorites')}>
              <Heart className="h-5 w-5" />
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/messages" aria-label={t('messages')}>
              <MessageCircle className="h-5 w-5" />
            </Link>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('profile')}
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('orders')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/favorites" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {t('favorites')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex items-center gap-2 w-full text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-1 md:hidden ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label={t('search')}
          >
            <Search className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t('profile')}>
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('myAccount')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('profile')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('orders')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {t('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action={signOut} className="w-full">
                  <button type="submit" className="flex items-center gap-2 w-full text-red-600 focus:text-red-600">
                    <LogOut className="h-4 w-4" />
                    {t('logout')}
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Expanded */}
      {mobileSearchOpen && (
        <div className="border-t border-gray-100 px-4 py-2 md:hidden">
          <SearchBar
            placeholder={t('searchPlaceholder')}
          />
        </div>
      )}
    </header>
  );
}
