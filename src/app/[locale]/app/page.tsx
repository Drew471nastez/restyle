import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  ShoppingBag,
  Package,
  MessageCircle,
  Wallet,
  Plus,
  ClipboardList,
  Heart,
} from 'lucide-react';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  let activeListings = 0;
  let pendingOrders = 0;
  let unreadMessages = 0;
  let walletBalance = 0;
  let currency = 'EUR';
  let displayName = '';

  try {
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'active');
    activeListings = listingsCount || 0;
  } catch {
    // silently fail
  }

  try {
    const { count: buyingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', user.id)
      .in('status', ['pending', 'paid', 'shipped']);

    const { count: sellingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .in('status', ['pending', 'paid', 'shipped']);

    pendingOrders = (buyingCount || 0) + (sellingCount || 0);
  } catch {
    // silently fail
  }

  try {
    const { count: msgCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .neq('sender_id', user.id)
      .eq('is_read', false);
    unreadMessages = msgCount || 0;
  } catch {
    // silently fail
  }

  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('available_balance, currency')
      .eq('user_id', user.id)
      .single();
    if (wallet) {
      walletBalance = wallet.available_balance || 0;
      currency = wallet.currency || 'EUR';
    }
  } catch {
    // silently fail
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();
    if (profile) {
      displayName = profile.display_name || profile.username || '';
    }
  } catch {
    // silently fail
  }

  const stats = [
    {
      label: t('activeListings'),
      value: activeListings,
      icon: ShoppingBag,
      color: 'bg-teal-100 text-teal-600',
      href: '/app/listings',
    },
    {
      label: t('pendingOrders'),
      value: pendingOrders,
      icon: Package,
      color: 'bg-amber-100 text-amber-600',
      href: '/app/orders',
    },
    {
      label: t('unreadMessages'),
      value: unreadMessages,
      icon: MessageCircle,
      color: 'bg-blue-100 text-blue-600',
      href: '/app/messages',
    },
    {
      label: t('walletBalance'),
      value: `${(walletBalance / 100).toFixed(2)} ${currency}`,
      icon: Wallet,
      color: 'bg-emerald-100 text-emerald-600',
      href: '/app/wallet',
    },
  ];

  const quickActions = [
    {
      label: t('sell'),
      description: t('sellDescription'),
      icon: Plus,
      href: '/app/sell',
      primary: true,
    },
    {
      label: t('viewOrders'),
      description: t('viewOrdersDescription'),
      icon: ClipboardList,
      href: '/app/orders',
      primary: false,
    },
    {
      label: t('messages'),
      description: t('messagesDescription'),
      icon: MessageCircle,
      href: '/app/messages',
      primary: false,
    },
    {
      label: t('favorites'),
      description: t('favoritesDescription'),
      icon: Heart,
      href: '/app/favorites',
      primary: false,
    },
  ];

  return (
    <div className="px-4 py-6 sm:px-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('welcome', { name: displayName || t('there') })}
        </h1>
        <p className="mt-1 text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('quickActions')}
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
                action.primary
                  ? 'border-teal-200 bg-teal-50 hover:bg-teal-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  action.primary
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    action.primary ? 'text-teal-700' : 'text-gray-900'
                  }`}
                >
                  {action.label}
                </p>
                <p
                  className={`text-xs ${
                    action.primary ? 'text-teal-600' : 'text-gray-500'
                  }`}
                >
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
