import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { CATEGORIES, CONDITIONS, SIZES } from '@/lib/constants';
import { parseSearchParams, buildListingsQuery } from '@/lib/search/filters';
import { formatPrice } from '@/lib/utils';
import { Heart, SlidersHorizontal, Sparkles } from 'lucide-react';

interface BrowsePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const t = await getTranslations('browse');
  const params = await searchParams;
  const filters = parseSearchParams(params);

  let listings: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    size: string;
    condition: string;
    brand: string | null;
    images: string[];
    favorites_count: number;
    profiles: {
      username: string;
      avatar_url: string | null;
      is_pro: boolean;
    };
  }> = [];
  let totalCount = 0;

  try {
    const supabase = await createServerClient();
    const { data, count, error } = await buildListingsQuery(supabase, filters);
    if (!error && data) {
      listings = data;
      totalCount = count || 0;
    }
  } catch {
    // Build-safe: continue with empty listings
  }

  const totalPages = Math.ceil(totalCount / (filters.per_page || 24));
  const currentPage = filters.page || 1;

  const conditionLabels: Record<string, string> = {
    new_with_tags: 'New with tags',
    like_new: 'Like new',
    good: 'Good',
    fair: 'Fair',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalCount} {t('results')}
            </p>
          </div>

          {/* Mobile filter toggle */}
          <label
            htmlFor="filter-toggle"
            className="lg:hidden flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t('filters')}
          </label>
        </div>

        <input type="checkbox" id="filter-toggle" className="peer hidden" />

        <div className="flex gap-6">
          {/* Filter sidebar */}
          <aside className="hidden peer-checked:block lg:!block w-full lg:w-60 shrink-0 mb-6 lg:mb-0">
            <form method="get" className="bg-white rounded-xl border border-gray-200 p-5 space-y-5 sticky top-32">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('search')}
                </label>
                <input
                  name="q"
                  type="text"
                  defaultValue={filters.q || ''}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('category')}
                </label>
                <select
                  name="category"
                  defaultValue={filters.category || ''}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-white"
                >
                  <option value="">{t('allCategories')}</option>
                  {CATEGORIES.map((cat) => (
                    <optgroup key={cat.slug} label={cat.label}>
                      {cat.subcategories.map((sub) => (
                        <option key={`${cat.slug}-${sub}`} value={`${cat.slug}-${sub}`}>
                          {sub.charAt(0).toUpperCase() + sub.slice(1)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('size')}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZES.clothing.map((size) => (
                    <label
                      key={size}
                      className="flex items-center justify-center rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 cursor-pointer hover:border-teal-500 hover:text-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:border-teal-500 has-[:checked]:text-teal-600 transition-colors"
                    >
                      <input type="checkbox" name="size" value={size} defaultChecked={filters.size?.includes(size)} className="sr-only" />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('condition')}
                </label>
                <div className="space-y-1.5">
                  {CONDITIONS.map((cond) => (
                    <label key={cond.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" name="condition" value={cond.value} defaultChecked={filters.condition?.includes(cond.value)} className="rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
                      {cond.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('priceRange')}
                </label>
                <div className="flex items-center gap-2">
                  <input name="price_min" type="number" min={0} defaultValue={filters.price_min || ''} placeholder={t('min')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" />
                  <span className="text-gray-400 text-sm">–</span>
                  <input name="price_max" type="number" min={0} defaultValue={filters.price_max || ''} placeholder={t('max')} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none" />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('sortBy')}
                </label>
                <select name="sort" defaultValue={filters.sort || 'newest'} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none bg-white">
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="price_asc">{t('sortPriceAsc')}</option>
                  <option value="price_desc">{t('sortPriceDesc')}</option>
                  <option value="popular">{t('sortPopular')}</option>
                </select>
              </div>

              <button type="submit" className="w-full rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors">
                {t('applyFilters')}
              </button>
            </form>
          </aside>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {listings.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium mb-1">{t('noResults')}</p>
                <p className="text-sm text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/item/${listing.id}`}
                    className="group"
                  >
                    {/* Image */}
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden relative">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Sparkles className="h-8 w-8" />
                        </div>
                      )}
                      {listing.profiles?.is_pro && (
                        <span className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                      {/* Favorite count badge */}
                      {(listing.favorites_count || 0) > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                          <Heart className="h-3 w-3 text-gray-600" />
                          <span className="text-[10px] font-medium text-gray-700">{listing.favorites_count}</span>
                        </div>
                      )}
                      {/* Hover heart */}
                      <div className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Heart className="h-3.5 w-3.5 text-gray-600" />
                      </div>
                    </div>
                    {/* Info */}
                    <div className="mt-1.5 px-0.5">
                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(listing.price, listing.currency)}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {listing.size}
                        {listing.condition && <> &middot; {conditionLabels[listing.condition] || listing.condition}</>}
                      </p>
                      {listing.brand && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{listing.brand}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-1 mt-8">
                {currentPage > 1 && (
                  <Link
                    href={`/browse?${new URLSearchParams({ ...params as Record<string, string>, page: String(currentPage - 1) }).toString()}`}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('previous')}
                  </Link>
                )}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={`/browse?${new URLSearchParams({ ...params as Record<string, string>, page: String(pageNum) }).toString()}`}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? 'bg-teal-500 text-white'
                          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}
                {currentPage < totalPages && (
                  <Link
                    href={`/browse?${new URLSearchParams({ ...params as Record<string, string>, page: String(currentPage + 1) }).toString()}`}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('next')}
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
