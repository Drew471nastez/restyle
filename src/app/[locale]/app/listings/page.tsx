import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  sold: 'bg-red-100 text-red-700',
  removed: 'bg-red-100 text-red-700',
};

export default async function ListingsPage() {
  const t = await getTranslations('listings');
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  let listings: Array<{
    id: string;
    title: string;
    price: number;
    status: string;
    images: string[];
    created_at: string;
    category: string;
  }> = [];

  try {
    const { data } = await supabase
      .from('listings')
      .select('id, title, price, status, images, created_at, category')
      .eq('seller_id', user.id)
      .neq('status', 'removed')
      .order('created_at', { ascending: false });

    listings = data || [];
  } catch {
    // silently fail
  }

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('count', { count: listings.length })}
          </p>
        </div>
        <Link
          href="/app/sell"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
        >
          <Plus className="h-4 w-4" />
          {t('newListing')}
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {t('emptyTitle')}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            {t('emptyDescription')}
          </p>
          <Link
            href="/app/sell"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
          >
            <Plus className="h-4 w-4" />
            {t('createFirst')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
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
                    <Package className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium ${
                    STATUS_STYLES[listing.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t(`status.${listing.status}`)}
                </span>
              </div>

              <div className="p-4">
                <h3 className="truncate font-semibold text-gray-900">
                  {listing.title}
                </h3>
                <p className="mt-0.5 text-xs capitalize text-gray-500">
                  {listing.category}
                </p>
                <p className="mt-2 text-lg font-bold text-teal-600">
                  {(listing.price / 100).toFixed(2)} RON
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(listing.created_at).toLocaleDateString()}
                </p>

                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <Link
                    href={`/app/listings/${listing.id}/edit`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('edit')}
                  </Link>
                  <form
                    action={async () => {
                      'use server';
                      const { deleteListing } = await import(
                        '@/actions/listings'
                      );
                      await deleteListing(listing.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t('delete')}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
