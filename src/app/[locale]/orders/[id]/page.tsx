import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OrderActions } from './OrderActions';
import {
  CreditCard,
  Truck,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const TIMELINE_STEPS = [
  { key: 'paid', label: 'Paid', icon: CreditCard },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: PackageCheck },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const STATUS_ORDER = ['paid', 'shipped', 'delivered', 'completed'];

function getStatusVariant(status: string) {
  switch (status) {
    case 'completed':
      return 'default' as const;
    case 'disputed':
      return 'destructive' as const;
    case 'cancelled':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
}

export default async function OrderDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
      *,
      listing:listings(id, title, images, size, condition, brand),
      buyer:profiles!buyer_id(id, username, display_name, avatar_url),
      seller:profiles!seller_id(id, username, display_name, avatar_url)
    `
    )
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  // Verify user is buyer or seller
  if (order.buyer_id !== user.id && order.seller_id !== user.id) {
    notFound();
  }

  const isBuyer = order.buyer_id === user.id;
  const orderWithRelations = order as typeof order & {
    listing: { id: string; title: string; images: string[]; size: string; condition: string; brand: string | null };
    buyer: { id: string; username: string; display_name: string | null; avatar_url: string | null };
    seller: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  };
  const listing = orderWithRelations.listing;
  const buyer = orderWithRelations.buyer;
  const seller = orderWithRelations.seller;
  const currentStepIndex = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
      </div>

      <div className="space-y-4">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {order.status === 'disputed' ? (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Order Disputed</p>
                  {order.dispute_reason && (
                    <p className="text-sm text-red-700 mt-1">
                      {order.dispute_reason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {TIMELINE_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        {index > 0 && (
                          <div
                            className={`flex-1 h-0.5 ${
                              index <= currentStepIndex
                                ? 'bg-green-600'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCurrent
                              ? 'bg-green-600 text-white'
                              : isCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {index < TIMELINE_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 ${
                              index < currentStepIndex
                                ? 'bg-green-600'
                                : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 ${
                          isCompleted
                            ? 'text-green-600 font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {listing?.images?.[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No image
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {listing?.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {listing?.brand && `${listing.brand} · `}
                  {listing?.size} · {listing?.condition}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Item price</span>
                <span>
                  {(order.item_price / 100).toFixed(2)} {order.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>
                  {(order.shipping_cost / 100).toFixed(2)} {order.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Platform fee</span>
                <span>
                  {(order.platform_fee / 100).toFixed(2)} {order.currency}
                </span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>
                  {(order.total_amount / 100).toFixed(2)} {order.currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer / Seller Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isBuyer ? 'Seller' : 'Buyer'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                {(isBuyer ? seller : buyer)?.avatar_url ? (
                  <img
                    src={(isBuyer ? seller : buyer).avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">
                    {(
                      (isBuyer ? seller : buyer)?.display_name?.[0] ||
                      (isBuyer ? seller : buyer)?.username?.[0] ||
                      '?'
                    ).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {(isBuyer ? seller : buyer)?.display_name ||
                    (isBuyer ? seller : buyer)?.username}
                </p>
                <p className="text-sm text-gray-500">
                  @{(isBuyer ? seller : buyer)?.username}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Info */}
        {order.tracking_number && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {order.shipping_provider && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Carrier</span>
                    <span>{order.shipping_provider}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tracking number</span>
                  <span className="font-mono">{order.tracking_number}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <OrderActions
          orderId={order.id}
          status={order.status}
          isBuyer={isBuyer}
        />
      </div>
    </div>
  );
}
