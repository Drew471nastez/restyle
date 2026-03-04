import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { CONDITIONS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';

interface ItemPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const t = await getTranslations('item');

  let listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    size: string;
    condition: string;
    brand: string | null;
    category: string;
    images: string[];
    created_at: string;
    favorites_count: number;
    views_count: number;
    profiles: {
      id: string;
      username: string;
      avatar_url: string | null;
      rating_avg: number | null;
      rating_count: number;
      is_pro: boolean;
      is_verified: boolean;
    };
  } | null = null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles!seller_id(id, username, avatar_url, rating_avg, rating_count, is_pro, is_verified)')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      listing = data;
    }
  } catch {
    // Build-safe: continue with null listing
  }

  if (!listing) {
    notFound();
  }

  const conditionLabel = CONDITIONS.find((c) => c.value === listing.condition)?.label || listing.condition;
  const seller = listing.profiles;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="aspect-[4/5] bg-white rounded-xl overflow-hidden border border-gray-100">
              {listing.images?.[0] ? (
                <img
                  src={listing.images[0]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {listing.images.map((image, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-colors ${
                      index === 0 ? 'border-teal-500' : 'border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${listing.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Price & title */}
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(listing.price, listing.currency)}
              </p>
              <h1 className="text-lg text-gray-700 mt-2">{listing.title}</h1>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  {listing.views_count} {t('views')}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  {listing.favorites_count} {t('favorites')}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Link
                href={`/checkout/${listing.id}`}
                className="flex items-center justify-center w-full rounded-full bg-teal-500 px-6 py-3.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
              >
                {t('buyNow')}
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="rounded-full border border-teal-500 px-4 py-3 text-sm font-semibold text-teal-500 hover:bg-teal-50 transition-colors"
                >
                  {t('makeOffer')}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('messageSeller')}
                </button>
              </div>
            </div>

            {/* Details table */}
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
              <div className="flex justify-between px-5 py-3.5">
                <span className="text-sm text-gray-500">{t('size')}</span>
                <span className="text-sm font-medium text-gray-900">{listing.size}</span>
              </div>
              <div className="flex justify-between px-5 py-3.5">
                <span className="text-sm text-gray-500">{t('condition')}</span>
                <span className="text-sm font-medium text-gray-900">{conditionLabel}</span>
              </div>
              {listing.brand && (
                <div className="flex justify-between px-5 py-3.5">
                  <span className="text-sm text-gray-500">{t('brand')}</span>
                  <span className="text-sm font-medium text-gray-900">{listing.brand}</span>
                </div>
              )}
              <div className="flex justify-between px-5 py-3.5">
                <span className="text-sm text-gray-500">{t('category')}</span>
                <span className="text-sm font-medium text-gray-900">{listing.category}</span>
              </div>
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('description')}</h3>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Seller card */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-100 overflow-hidden shrink-0">
                  {seller.avatar_url ? (
                    <img
                      src={seller.avatar_url}
                      alt={seller.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                      {seller.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {seller.username}
                    </span>
                    {seller.is_verified && (
                      <svg className="h-4 w-4 text-teal-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M15.61 10.186a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                      </svg>
                    )}
                    {seller.is_pro && (
                      <span className="bg-teal-50 text-teal-600 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </div>
                  {seller.rating_avg !== null && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-500">
                        {seller.rating_avg.toFixed(1)} ({seller.rating_count})
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  href={`/profile/${seller.id}`}
                  className="text-xs font-medium text-teal-500 hover:text-teal-600 transition-colors"
                >
                  {t('viewProfile')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
