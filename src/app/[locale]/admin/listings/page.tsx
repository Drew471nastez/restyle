import { supabaseAdmin } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminListingActions } from './AdminListingActions';

function getStatusVariant(status: string) {
  switch (status) {
    case 'active':
      return 'default' as const;
    case 'sold':
      return 'secondary' as const;
    case 'removed':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export default async function AdminListingsPage() {
  const { data: listings } = await supabaseAdmin
    .from('listings')
    .select('*, seller:profiles!seller_id(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Listings Management
      </h1>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-4 font-medium text-gray-500">Item</th>
                <th className="p-4 font-medium text-gray-500">Seller</th>
                <th className="p-4 font-medium text-gray-500">Price</th>
                <th className="p-4 font-medium text-gray-500">Status</th>
                <th className="p-4 font-medium text-gray-500">Views</th>
                <th className="p-4 font-medium text-gray-500">Date</th>
                <th className="p-4 font-medium text-gray-500 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {listings?.map((listing) => {
                const typedListing = listing as typeof listing & {
                  seller: { username: string; display_name: string };
                };
                const seller = typedListing.seller;
                return (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {listing.images[0] ? (
                            <img
                              src={listing.images[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {listing.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {listing.category} &middot; {listing.size}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {seller?.display_name || seller?.username || '-'}
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {(listing.price / 100).toFixed(2)} {listing.currency}
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusVariant(listing.status)}>
                        {listing.status}
                      </Badge>
                      {listing.is_boosted && (
                        <Badge variant="secondary" className="ml-1">
                          Boosted
                        </Badge>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {listing.views_count}
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <AdminListingActions
                        listingId={listing.id}
                        status={listing.status}
                        isFeatured={listing.is_boosted}
                      />
                    </td>
                  </tr>
                );
              })}

              {(!listings || listings.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No listings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
