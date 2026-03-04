import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { CATEGORIES, CONDITIONS, SIZES } from '@/lib/constants';
import { parseSearchParams, buildListingsQuery } from '@/lib/search/filters';
import { formatPrice } from '@/lib/utils';

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
    brand: string | null;
    images: string[];
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalCount} {t('results')}
            </p>
          </div>

          {/* Mobile filter toggle */}
          <label
            htmlFor="filter-toggle"
            className="lg:hidden flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            {t('filters')}
          </label>
        </div>

        {/* Hidden checkbox for mobile filter toggle */}
        <input type="checkbox" id="filter-toggle" className="peer hidden" />

        <div className="flex gap-6">
          {/* Filter sidebar */}
          <aside className="hidden peer-checked:block lg:!block w-full lg:w-64 shrink-0 mb-6 lg:mb-0">
            <form method="get" className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-6">
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
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
                      <input
                        type="checkbox"
                        name="size"
                        value={size}
                        defaultChecked={filters.size?.includes(size)}
                        className="sr-only"
                      />
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
                      <input
                        type="checkbox"
                        name="condition"
                        value={cond.value}
                        defaultChecked={filters.condition?.includes(cond.value)}
                        className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                      />
                      {cond.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('priceRange')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    name="price_min"
                    type="number"
                    min={0}
                    defaultValue={filters.price_min || ''}
                    placeholder={t('min')}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                  <span className="text-gray-400 text-sm">-</span>
                  <input
                    name="price_max"
                    type="number"
                    min={0}
                    defaultValue={filters.price_max || ''}
                    placeholder={t('max')}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('sortBy')}
                </label>
                <select
                  name="sort"
                  defaultValue={filters.sort || 'newest'}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                >
                  <option value="newest">{t('sortNewest')}</option>
                  <option value="price_asc">{t('sortPriceAsc')}</option>
                  <option value="price_desc">{t('sortPriceDesc')}</option>
                  <option value="popular">{t('sortPopular')}</option>
                </select>
              </div>

              {/* Apply */}
              <button
                type="submit"
                className="w-full rounded-full bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-600 transition-colors"
              >
                {t('applyFilters')}
              </button>
            </form>
          </aside>

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {listings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="text-gray-500 text-sm">{t('noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/item/${listing.id}`}
                    className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                      {listing.images?.[0] ? (
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        </div>
                      )}
                      {listing.profiles?.is_pro && (
                        <span className="absolute top-2 left-2 bg-teal-500 text-white text-[10px] font-bold uppercase px-1.5 py-0.5 rounded">
                          PRO
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-base font-bold text-gray-900">
                        {formatPrice(listing.price, listing.currency)}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{listing.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {listing.size}
                        {listing.brand && <> &middot; {listing.brand}</>}
                      </p>
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
