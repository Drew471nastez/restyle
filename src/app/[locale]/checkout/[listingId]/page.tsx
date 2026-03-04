import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckoutButton } from './CheckoutButton';

const SHIPPING_COST = 499; // 4.99 EUR in cents
const PLATFORM_FEE_RATE = 0.05; // 5%

export default async function CheckoutPage({
  params: { listingId },
}: {
  params: { listingId: string };
}) {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(id, username, display_name, avatar_url)')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();

  if (!listing) {
    notFound();
  }

  // Prevent buying own listing
  if (listing.seller_id === user.id) {
    redirect(`/item/${listingId}`);
    return null;
  }

  const platformFee = Math.round(listing.price * PLATFORM_FEE_RATE);
  const total = listing.price + SHIPPING_COST + platformFee;
  const typedListing = listing as typeof listing & {
    profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null };
  };
  const seller = typedListing.profiles;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="space-y-4">
        {/* Listing Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Item Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {listing.images[0] ? (
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
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {listing.title}
                </h3>
                <p className="text-sm text-gray-500">
                  Size: {listing.size} &middot; {listing.condition}
                </p>
                {listing.brand && (
                  <p className="text-sm text-gray-500">{listing.brand}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Sold by{' '}
                  <span className="font-medium">
                    {seller?.display_name || seller?.username}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Item price</span>
                <span className="text-gray-900">
                  {(listing.price / 100).toFixed(2)} {listing.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="text-gray-900">
                  {(SHIPPING_COST / 100).toFixed(2)} {listing.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Buyer protection fee</span>
                <span className="text-gray-900">
                  {(platformFee / 100).toFixed(2)} {listing.currency}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-green-600">
                  {(total / 100).toFixed(2)} {listing.currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Protection Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Buyer Protection
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your payment is held securely until you confirm delivery. If
                  the item doesn&apos;t match the description, you can open a
                  dispute.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pay Button */}
        <CheckoutButton listingId={listingId} total={total} currency={listing.currency} />
      </div>
    </div>
  );
}
