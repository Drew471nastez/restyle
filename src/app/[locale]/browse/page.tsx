import { createServerClient } from '@/lib/supabase/server';
import { parseSearchParams, buildListingsQuery } from '@/lib/search/filters';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, CONDITIONS, SIZES } from '@/lib/constants';

interface BrowsePageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const t = await getTranslations('browse');
  const supabase = await createServerClient();
  const filters = parseSearchParams(searchParams);
  const { data: listings, count } = await buildListingsQuery(supabase, filters);

  const totalPages = Math.ceil((count || 0) / (filters.per_page || 24));
  const currentPage = filters.page || 1;

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...searchParams, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    }
    return `/browse?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">{t('title')}</h1>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Filter Sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-4">
            {/* Search */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('search')}</h3>
              <form>
                <input
                  type="text"
                  name="q"
                  defaultValue={filters.q || ''}
                  placeholder={t('searchPlaceholder')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </form>
            </div>

            {/* Categories */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('categories')}</h3>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ category: undefined, page: '1' })}
                  className={`block rounded-md px-2 py-1.5 text-sm ${!filters.category ? 'bg-green-50 font-medium text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('allCategories')}
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={buildUrl({ category: cat.slug, page: '1' })}
                    className={`block rounded-md px-2 py-1.5 text-sm ${filters.category === cat.slug ? 'bg-green-50 font-medium text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('sizes')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.clothing.map((size) => {
                  const isActive = filters.size?.includes(size);
                  const newSizes = isActive
                    ? filters.size?.filter((s) => s !== size)
                    : [...(filters.size || []), size];
                  return (
                    <Link
                      key={size}
                      href={buildUrl({ size: newSizes?.join(',') || undefined, page: '1' })}
                      className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
                        isActive
                          ? 'border-green-600 bg-green-50 text-green-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {size}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Condition */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('condition')}</h3>
              <div className="space-y-1">
                {CONDITIONS.map((cond) => {
                  const isActive = filters.condition?.includes(cond.value);
                  const newConditions = isActive
                    ? filters.condition?.filter((c) => c !== cond.value)
                    : [...(filters.condition || []), cond.value];
                  return (
                    <Link
                      key={cond.value}
                      href={buildUrl({ condition: newConditions?.join(',') || undefined, page: '1' })}
                      className={`block rounded-md px-2 py-1.5 text-sm ${
                        isActive
                          ? 'bg-green-50 font-medium text-green-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cond.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('priceRange')}</h3>
              <form className="flex items-center gap-2">
                <input
                  type="number"
                  name="price_min"
                  defaultValue={filters.price_min || ''}
                  placeholder={t('min')}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  name="price_max"
                  defaultValue={filters.price_max || ''}
                  placeholder={t('max')}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                />
              </form>
            </div>

            {/* Sort */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{t('sortBy')}</h3>
              <div className="space-y-1">
                {(['newest', 'price_asc', 'price_desc', 'popular'] as const).map((sortKey) => (
                  <Link
                    key={sortKey}
                    href={buildUrl({ sort: sortKey, page: '1' })}
                    className={`block rounded-md px-2 py-1.5 text-sm ${
                      filters.sort === sortKey
                        ? 'bg-green-50 font-medium text-green-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t(`sort.${sortKey}`)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Listings Grid */}
        <main className="flex-1">
          {/* Active Filters */}
          {(filters.category || filters.size?.length || filters.condition?.length) && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  {filters.category}
                  <Link href={buildUrl({ category: undefined })} className="ml-1 text-gray-500 hover:text-gray-700">
                    x
                  </Link>
                </Badge>
              )}
              {filters.size?.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <Link
                    href={buildUrl({ size: filters.size?.filter((sz) => sz !== s).join(',') || undefined })}
                    className="ml-1 text-gray-500 hover:text-gray-700"
                  >
                    x
                  </Link>
                </Badge>
              ))}
            </div>
          )}

          <p className="mb-4 text-sm text-gray-500">
            {t('resultsCount', { count: count || 0 })}
          </p>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/item/${listing.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-gray-100">
                    {listing.images?.[0] && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {listing.title}
                    </p>
                    <p className="text-xs text-gray-500">{listing.size} &middot; {listing.brand}</p>
                    <p className="mt-1 text-sm font-bold text-green-700">
                      {(listing.price / 100).toFixed(2)} RON
                    </p>
                    {listing.profiles && (
                      <p className="mt-1 text-xs text-gray-400">
                        {listing.profiles.username}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
              <p className="text-gray-500">{t('noResults')}</p>
              <Link href="/browse" className="mt-2 text-sm font-medium text-green-600 hover:text-green-700">
                {t('clearFilters')}
              </Link>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={buildUrl({ page: String(currentPage - 1) })}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {t('previous')}
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <Link
                    key={pageNum}
                    href={buildUrl({ page: String(pageNum) })}
                    className={`rounded-md px-3 py-2 text-sm ${
                      pageNum === currentPage
                        ? 'bg-green-600 font-medium text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link
                  href={buildUrl({ page: String(currentPage + 1) })}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  {t('next')}
                </Link>
              )}
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
