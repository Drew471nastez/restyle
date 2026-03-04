import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { DisputeActions } from './DisputeActions';

export default async function AdminDisputesPage() {
  const { data: disputes } = await supabaseAdmin
    .from('orders')
    .select(
      `
      *,
      listing:listings(id, title, images),
      buyer:profiles!buyer_id(id, username, display_name),
      seller:profiles!seller_id(id, username, display_name)
    `
    )
    .eq('status', 'disputed')
    .order('updated_at', { ascending: false });

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Disputes</h1>

      {!disputes || disputes.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active disputes</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes.map((order) => {
            const typedOrder = order as typeof order & {
              listing: { id: string; title: string; images: string[] };
              buyer: { id: string; username: string; display_name: string };
              seller: { id: string; username: string; display_name: string };
            };
            const listing = typedOrder.listing;
            const buyer = typedOrder.buyer;
            const seller = typedOrder.seller;

            return (
              <Card key={order.id}>
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Item thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {listing?.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {listing?.title || 'Unknown item'}
                        </h3>
                        <Badge variant="destructive">Disputed</Badge>
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        Order: {order.id.slice(0, 8)}... &middot;{' '}
                        {(order.total_amount / 100).toFixed(2)} {order.currency}
                      </p>

                      <div className="flex gap-4 text-sm text-gray-600 mb-2">
                        <span>
                          Buyer:{' '}
                          <span className="font-medium">
                            {buyer?.display_name || buyer?.username}
                          </span>
                        </span>
                        <span>
                          Seller:{' '}
                          <span className="font-medium">
                            {seller?.display_name || seller?.username}
                          </span>
                        </span>
                      </div>

                      {order.dispute_reason && (
                        <div className="bg-red-50 rounded-md p-3 text-sm text-red-800 mb-3">
                          <strong>Reason:</strong> {order.dispute_reason}
                        </div>
                      )}

                      <DisputeActions orderId={order.id} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
