'use client';

import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/app', icon: Home, label: 'Home' },
  { href: '/browse', icon: Search, label: 'Search' },
  { href: '/app/sell', icon: Plus, label: 'Sell', isAction: true },
  { href: '/app/messages', icon: MessageCircle, label: 'Inbox' },
  { href: '/app/profile', icon: User, label: 'Profile' },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden safe-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/app' && item.href !== '/browse' && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center -mt-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                  <Icon className="h-6 w-6" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-1 px-3',
                isActive ? 'text-violet-600' : 'text-gray-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
