import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Heart, ShoppingBag } from 'lucide-react';

interface FavoriteListing {
  id: string;
  title: string;
  price: number;
  images: string[];
  status: string;
  category: string;
  size: string;
  condition: string;
  brand: string | null;
  seller: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export default async function FavoritesPage() {
  const t = await getTranslations('favorites');
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  let favorites: FavoriteListing[] = [];

  try {
    const { data: favData } = await supabase
      .from('favorites')
      .select(
        'listing_id, listing:listings(id, title, price, images, status, category, size, condition, brand, seller:profiles!seller_id(id, username, avatar_url))'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (favData) {
      favorites = favData
        .map((f: Record<string, unknown>) => f.listing as unknown as FavoriteListing)
        .filter(Boolean);
    }
  } catch {
    // silently fail
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('count', { count: favorites.length })}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Heart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {t('emptyTitle')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {t('emptyDescription')}
          </p>
          <Link
            href="/browse"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            <ShoppingBag className="h-4 w-4" />
            {t('browseCTA')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {favorites.map((listing) => (
            <Link
              key={listing.id}
              href={`/item/${listing.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                {listing.images?.[0] ? (
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <button
                  type="button"
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm"
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </button>
                {listing.status === 'sold' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-900">
                      {t('sold')}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="text-sm font-bold text-teal-600">
                  {(listing.price / 100).toFixed(2)} RON
                </p>
                <h3 className="mt-0.5 truncate text-sm text-gray-900">
                  {listing.title}
                </h3>
                <div className="mt-1 flex items-center gap-1.5">
                  {listing.brand && (
                    <span className="text-xs text-gray-500">
                      {listing.brand}
                    </span>
                  )}
                  {listing.brand && listing.size && (
                    <span className="text-xs text-gray-300">|</span>
                  )}
                  {listing.size && (
                    <span className="text-xs text-gray-500">
                      {listing.size}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
