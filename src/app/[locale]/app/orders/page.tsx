import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Package, ShoppingBag, ArrowRight } from 'lucide-react';

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  disputed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
};

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  listing: {
    id: string;
    title: string;
    images: string[];
  } | null;
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations('orders');
  const supabase = await createServerClient();
  const params = await searchParams;
  const activeTab = params.tab || 'buying';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  let buyingOrders: Order[] = [];
  let sellingOrders: Order[] = [];

  try {
    const { data: buying } = await supabase
      .from('orders')
      .select('id, status, total_price, created_at, listing:listings(id, title, images)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    buyingOrders = (buying || []) as unknown as Order[];
  } catch {
    // silently fail
  }

  try {
    const { data: selling } = await supabase
      .from('orders')
      .select('id, status, total_price, created_at, listing:listings(id, title, images)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    sellingOrders = (selling || []) as unknown as Order[];
  } catch {
    // silently fail
  }

  const orders = activeTab === 'selling' ? sellingOrders : buyingOrders;

  const tabs = [
    { key: 'buying', label: t('buying'), count: buyingOrders.length },
    { key: 'selling', label: t('selling'), count: sellingOrders.length },
  ];

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/app/orders?tab=${tab.key}`}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.key === 'buying' ? (
              <ShoppingBag className="h-4 w-4" />
            ) : (
              <Package className="h-4 w-4" />
            )}
            {tab.label}
            {tab.count > 0 && (
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Orders */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {t('emptyTitle')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {activeTab === 'buying'
              ? t('emptyBuyingDescription')
              : t('emptySellingDescription')}
          </p>
          {activeTab === 'buying' && (
            <Link
              href="/browse"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
            >
              {t('browseCTA')}
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/app/orders/${order.id}`}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {order.listing?.images?.[0] ? (
                  <img
                    src={order.listing.images[0]}
                    alt={order.listing.title || ''}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-gray-900">
                  {order.listing?.title || t('unknownItem')}
                </h3>
                <p className="mt-0.5 text-sm font-bold text-violet-600">
                  {(order.total_price / 100).toFixed(2)} RON
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    ORDER_STATUS_STYLES[order.status] ||
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t(`status.${order.status}`)}
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
