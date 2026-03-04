'use client';

import { useTranslations } from 'next-intl';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: Home, label: t('home'), isAction: false },
    { href: '/browse', icon: Search, label: t('browse'), isAction: false },
    { href: '/sell', icon: Plus, label: t('sell'), isAction: true },
    { href: '/messages', icon: MessageCircle, label: t('messages'), isAction: false },
    { href: '/profile', icon: User, label: t('profile'), isAction: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center py-2 px-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 text-xs transition-colors',
                isActive
                  ? 'text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 mb-0.5',
                  isActive && 'text-green-600'
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
