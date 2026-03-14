'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { ArrowRight, Shield, Truck, Banknote, Sparkles, ChevronRight, Loader2 } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  price: number;
  currency: string;
  brand: string | null;
  size: string;
  category: string;
  images: string[];
  profiles?: { username: string; avatar_url: string | null };
}

const PAGE_SIZE = 24;

export default function HomePage() {
  const t = useTranslations();
  const { user, loading: userLoading } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchListings = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoadingListings(true);

    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('listings')
        .select('*, profiles!seller_id(username, avatar_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      const items = (data || []) as Listing[];
      if (items.length < PAGE_SIZE) setHasMore(false);

      if (append) {
        setListings((prev) => [...prev, ...items]);
      } else {
        setListings(items);
        if (items.length >= PAGE_SIZE) setHasMore(true);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingListings(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchListings(0, false);
  }, [fetchListings]);

  // Infinite scroll observer
  useEffect(() => {
    if (!user) return;
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchListings(listings.length, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [user, hasMore, loadingMore, listings.length, fetchListings]);

  const categories = [
    { slug: 'women', label: t('categories.women'), emoji: '👗', color: 'from-pink-400 to-rose-500' },
    { slug: 'men', label: t('categories.men'), emoji: '👔', color: 'from-blue-400 to-indigo-500' },
    { slug: 'kids', label: t('categories.kids'), emoji: '🧸', color: 'from-amber-400 to-orange-500' },
    { slug: 'shoes', label: t('categories.shoes'), emoji: '👟', color: 'from-emerald-400 to-teal-500' },
    { slug: 'bags', label: t('categories.bags'), emoji: '👜', color: 'from-purple-400 to-violet-500' },
    { slug: 'accessories', label: t('categories.accessories'), emoji: '💍', color: 'from-cyan-400 to-sky-500' },
  ];

  // Loading skeleton
  if (userLoading || loadingListings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8 py-8">
          <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
                <div className="mt-2 space-y-1.5">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Listing card helper
  const ListingCard = ({ listing }: { listing: Listing }) => (
    <Link href={`/item/${listing.id}`} className="group">
      <div className="aspect-[3/4] bg-gray-100 rounded-xl overflow-hidden relative">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
            <Sparkles className="h-8 w-8" />
          </div>
        )}
        <div className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
        </div>
      </div>
      <div className="mt-2 px-0.5">
        <p className="text-base font-bold text-gray-900">
          {(listing.price / 100).toFixed(2)} <span className="text-xs font-normal text-gray-500">{listing.currency || 'RON'}</span>
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{listing.brand || listing.category}</p>
        <p className="text-xs text-gray-400 mt-0.5">{listing.size}</p>
      </div>
    </Link>
  );

  // --- LOGGED IN VIEW ---
  if (user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">For you</h2>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <Sparkles className="h-8 w-8 text-violet-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-500 mb-6 text-sm">Be the first to sell something on ReStyle!</p>
              <Link
                href="/app/sell"
                className="inline-flex items-center gap-2 h-11 px-7 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition shadow-sm"
              >
                Start selling
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={loaderRef} className="py-8 flex items-center justify-center">
            {loadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
            )}
            {!hasMore && listings.length > 0 && (
              <p className="text-sm text-gray-400">You&apos;ve seen it all!</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- GUEST VIEW ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-purple-500">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-[1440px] px-4 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white tracking-tight leading-tight">
              {t('common.tagline')}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed max-w-lg">
              Buy and sell pre-loved fashion. Join thousands who choose sustainable style.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white text-violet-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition shadow-lg shadow-black/10"
              >
                {t('nav.browse')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white/15 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition backdrop-blur-sm border border-white/20"
              >
                {t('common.signup')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="w-full bg-white border-b border-gray-100">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {[
              { icon: Shield, title: 'Buyer Protection', desc: 'Your money is safe until delivery' },
              { icon: Truck, title: 'Easy Shipping', desc: 'Pre-paid labels & locker delivery' },
              { icon: Banknote, title: 'Fast Payouts', desc: 'Direct to your bank account' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 py-4 px-4 sm:px-6">
                <div className="shrink-0 w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category Cards */}
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shop by category</h2>
            <Link href="/browse" className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
              {t('common.seeAll')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
            {categories.map((cat) => (
              <Link key={cat.slug} href={`/browse?category=${cat.slug}`} className="group shrink-0 w-36 sm:w-auto">
                <div className={`relative aspect-[4/5] sm:aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br ${cat.color} shadow-sm group-hover:shadow-md transition-shadow`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300">{cat.emoji}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <p className="text-white text-sm sm:text-base font-bold">{cat.label}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Fresh Listings */}
      <section className="pb-10 sm:pb-14">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Fresh listings</h2>
            <Link href="/browse" className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1">
              {t('common.seeAll')}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-500 mb-6 text-sm">Be the first to sell something on ReStyle!</p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 h-11 px-7 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition shadow-sm"
              >
                Start selling
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Popular Brands */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5">Popular brands</h2>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {['Nike', 'Zara', 'H&M', 'Adidas', 'Gucci', 'Prada', 'Mango', 'Pull&Bear', "Levi's", 'New Balance', 'Balenciaga', 'Bershka'].map((brand) => (
              <Link
                key={brand}
                href={`/browse?brand=${encodeURIComponent(brand)}`}
                className="shrink-0 flex items-center justify-center h-12 px-6 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 border border-gray-200 hover:border-violet-200 transition whitespace-nowrap"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-16 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">How it works</h2>
            <p className="mt-2 text-sm text-gray-500">Selling and buying made simple</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Upload', desc: 'Snap a photo, set a price, and list your item in seconds', icon: '📸' },
              { step: '2', title: 'Sell', desc: 'Buyers can purchase instantly or make offers. Chat to negotiate.', icon: '🤝' },
              { step: '3', title: 'Ship & earn', desc: 'Ship with a pre-paid label. Get paid once the buyer confirms.', icon: '💰' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <span className="text-4xl mb-4">{item.icon}</span>
                <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-3">
                  {item.step}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-14 sm:py-16 bg-gradient-to-br from-violet-600 to-purple-600">
        <div className="mx-auto max-w-[1440px] px-4 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to declutter your wardrobe?</h2>
          <p className="text-white/70 text-sm sm:text-base mb-8 max-w-lg mx-auto">
            Join ReStyle today and start selling your pre-loved fashion to thousands of buyers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white text-violet-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition shadow-lg"
            >
              {t('common.signup')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 bg-white/15 text-white rounded-xl text-sm font-bold hover:bg-white/25 transition backdrop-blur-sm border border-white/20"
            >
              {t('nav.browse')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
