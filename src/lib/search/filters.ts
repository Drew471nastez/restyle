import { SupabaseClient } from '@supabase/supabase-js';

export interface SearchFilters {
  q?: string;
  category?: string;
  size?: string[];
  condition?: string[];
  brand?: string[];
  price_min?: number;
  price_max?: number;
  country?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular';
  page?: number;
  per_page?: number;
}

export function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchFilters {
  const get = (key: string): string | undefined => {
    const v = params[key];
    return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  };

  return {
    q: get('q') || undefined,
    category: get('category') || undefined,
    size: get('size')?.split(',') || undefined,
    condition: get('condition')?.split(',') || undefined,
    brand: get('brand')?.split(',') || undefined,
    price_min: get('price_min') ? Number(get('price_min')) : undefined,
    price_max: get('price_max') ? Number(get('price_max')) : undefined,
    country: get('country') || undefined,
    sort: (get('sort') as SearchFilters['sort']) || 'newest',
    page: Number(get('page')) || 1,
    per_page: Math.min(Number(get('per_page')) || 24, 48),
  };
}

export function buildListingsQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  filters: SearchFilters
) {
  let query = supabase
    .from('listings')
    .select('*, profiles!seller_id(username, avatar_url, rating_avg, is_pro, is_verified)', { count: 'exact' })
    .eq('status', 'active');

  if (filters.q) {
    query = query.textSearch('fts', filters.q, { type: 'websearch' });
  }
  if (filters.category) {
    // Category filter may be "women-tops" (category-subcategory) or just "women" (category only)
    if (filters.category.includes('-')) {
      const [cat, ...subParts] = filters.category.split('-');
      const sub = subParts.join('-');
      query = query.eq('category', cat).eq('subcategory', sub);
    } else {
      query = query.eq('category', filters.category);
    }
  }
  if (filters.size?.length) {
    query = query.in('size', filters.size);
  }
  if (filters.condition?.length) {
    query = query.in('condition', filters.condition);
  }
  if (filters.brand?.length) {
    query = query.in('brand', filters.brand);
  }
  if (filters.price_min !== undefined) {
    query = query.gte('price', filters.price_min * 100);
  }
  if (filters.price_max !== undefined) {
    query = query.lte('price', filters.price_max * 100);
  }
  if (filters.country) {
    query = query.eq('country', filters.country);
  }

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('favorites_count', { ascending: false });
      break;
    case 'newest':
    default:
      query = query
        .order('is_featured', { ascending: false })
        .order('is_boosted', { ascending: false })
        .order('created_at', { ascending: false });
  }

  const page = filters.page || 1;
  const perPage = filters.per_page || 24;
  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  return query;
}
