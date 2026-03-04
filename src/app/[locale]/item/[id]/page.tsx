import { createServerClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CONDITIONS } from '@/lib/constants';

interface ItemPageProps {
  params: { id: string };
}

export default async function ItemPage({ params }: ItemPageProps) {
  const t = await getTranslations('item');
  const supabase = await createServerClient();

  const { data: listing, error } = await supabase
    .from('listings')
    .select('*, profiles!seller_id(id, username, avatar_url, bio, rating_avg, rating_count, is_pro, is_verified, created_at)')
    .eq('id', params.id)
    .single();

  if (error || !listing) {
    notFound();
  }

  const seller = listing.profiles;
  const conditionLabel = CONDITIONS.find((c) => c.value === listing.condition)?.label || listing.condition;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Image Gallery */}
        <div className="w-full lg:w-1/2">
          <div className="grid gap-2">
            {listing.images && listing.images.length > 0 ? (
              <>
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {listing.images.slice(1).map((img: string, i: number) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-md bg-gray-100">
                        <img
                          src={img}
                          alt={`${listing.title} ${i + 2}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg bg-gray-100">
                <span className="text-gray-400">{t('noImage')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Item Details */}
        <div className="w-full lg:w-1/2">
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <p className="mt-2 text-3xl font-bold text-green-700">
                {(listing.price / 100).toFixed(2)} RON
              </p>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{listing.size}</Badge>
              <Badge variant="secondary">{conditionLabel}</Badge>
              {listing.brand && <Badge variant="outline">{listing.brand}</Badge>}
              <Badge variant="outline">{listing.category}</Badge>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                {t('buyNow')}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  {t('makeOffer')}
                </Button>
                <Button variant="outline" className="flex-1">
                  {t('contactSeller')}
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="mb-2 text-sm font-semibold text-gray-700">{t('description')}</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                {listing.description}
              </p>
            </div>

            {/* Details Table */}
            <div className="rounded-lg border border-gray-200 p-4">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('details')}</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">{t('category')}</dt>
                  <dd className="font-medium text-gray-900">{listing.category}</dd>
                </div>
                {listing.subcategory && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('subcategory')}</dt>
                    <dd className="font-medium text-gray-900">{listing.subcategory}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-500">{t('size')}</dt>
                  <dd className="font-medium text-gray-900">{listing.size}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">{t('condition')}</dt>
                  <dd className="font-medium text-gray-900">{conditionLabel}</dd>
                </div>
                {listing.brand && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{t('brand')}</dt>
                    <dd className="font-medium text-gray-900">{listing.brand}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Seller Card */}
            {seller && (
              <Card>
                <CardContent className="p-4">
                  <Link href={`/profile/${seller.id}`} className="flex items-center gap-3">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                      {seller.avatar_url ? (
                        <img
                          src={seller.avatar_url}
                          alt={seller.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                          {seller.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{seller.username}</span>
                        {seller.is_verified && (
                          <Badge variant="default" className="text-xs">
                            {t('verified')}
                          </Badge>
                        )}
                        {seller.is_pro && (
                          <Badge variant="outline" className="text-xs">
                            PRO
                          </Badge>
                        )}
                      </div>
                      {seller.rating_avg !== null && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <span className="text-yellow-500">&#9733;</span>
                          <span>{Number(seller.rating_avg).toFixed(1)}</span>
                          <span>({seller.rating_count})</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
