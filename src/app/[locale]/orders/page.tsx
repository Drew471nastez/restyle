import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package } from 'lucide-react';

function getStatusVariant(status: string) {
  switch (status) {
    case 'paid':
      return 'default' as const;
    case 'shipped':
      return 'secondary' as const;
    case 'delivered':
      return 'default' as const;
    case 'completed':
      return 'default' as const;
    case 'disputed':
      return 'destructive' as const;
    case 'cancelled':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

interface OrderWithListing {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  listing: { id: string; title: string; images: string[] } | null;
}

function OrderCard({ order }: { order: OrderWithListing }) {
  const listing = order.listing;
  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
              {listing?.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-gray-900 truncate text-sm">
                  {listing?.title || 'Unknown item'}
                </h3>
                <Badge variant={getStatusVariant(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {(order.total_amount / 100).toFixed(2)} {order.currency}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function OrdersPage() {
  const t = await getTranslations();
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  const { data: buyingOrders } = await supabase
    .from('orders')
    .select('*, listing:listings(id, title, images)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  const { data: sellingOrders } = await supabase
    .from('orders')
    .select('*, listing:listings(id, title, images)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('nav.orders')}
      </h1>

      <Tabs defaultValue="buying">
        <TabsList className="w-full">
          <TabsTrigger value="buying" className="flex-1">
            Buying ({buyingOrders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="selling" className="flex-1">
            Selling ({sellingOrders?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buying">
          {!buyingOrders || buyingOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No purchases yet</p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {buyingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="selling">
          {!sellingOrders || sellingOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No sales yet</p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {sellingOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
