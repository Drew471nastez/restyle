import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Shield, Truck, Banknote, Sparkles } from 'lucide-react';

export default async function HomePage() {
  const t = await getTranslations();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listings: any[] = [];
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from('listings')
      .select('*, profiles!seller_id(username, avatar_url)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8);
    listings = data || [];
  } catch {
    // Supabase not configured
  }

  const categories = [
    { slug: 'women', label: t('categories.women'), emoji: '👗' },
    { slug: 'men', label: t('categories.men'), emoji: '👔' },
    { slug: 'kids', label: t('categories.kids'), emoji: '🧸' },
    { slug: 'shoes', label: t('categories.shoes'), emoji: '👟' },
    { slug: 'bags', label: t('categories.bags'), emoji: '👜' },
    { slug: 'accessories', label: t('categories.accessories'), emoji: '💍' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              {t('common.tagline')}
            </h1>
            <p className="mt-3 text-base text-gray-500 leading-relaxed">
              Buy and sell pre-loved fashion. Join thousands who choose sustainable style.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/browse"
                className="inline-flex items-center justify-center gap-2 h-11 px-7 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition shadow-lg shadow-teal-500/20"
              >
                {t('nav.browse')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 h-11 px-7 bg-white text-gray-700 rounded-full text-sm font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
              >
                {t('common.sell')}
              </Link>
            </div>
          </div>

          {/* Large Category Cards - Depop style */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
            <Link
              href="/browse?category=women"
              className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-300 via-pink-200 to-orange-200" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <p className="text-white text-xl sm:text-2xl font-bold">{t('categories.women')}</p>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5">Dresses, tops, shoes & more</p>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </Link>
            <Link
              href="/browse?category=men"
              className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-400 via-blue-300 to-cyan-200" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <p className="text-white text-xl sm:text-2xl font-bold">{t('categories.men')}</p>
                <p className="text-white/80 text-xs sm:text-sm mt-0.5">Jackets, sneakers, tees & more</p>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* Category Chips */}
      <section className="py-5 border-b border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="shrink-0 flex items-center gap-2 h-10 px-5 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-700 border border-gray-200 hover:border-teal-200 transition"
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Shield, title: 'Buyer Protection', desc: 'Your money is safe until you confirm delivery' },
              { icon: Truck, title: 'Easy Shipping', desc: 'Pre-paid labels and locker delivery options' },
              { icon: Banknote, title: 'Fast Payouts', desc: 'Get paid directly to your bank account' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 p-4">
                <div className="shrink-0 w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fresh Listings */}
      <section className="py-10 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Fresh listings</h2>
            <Link
              href="/browse"
              className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              {t('common.seeAll')}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/item/${listing.id}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
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
                  </div>
                  <div className="p-3">
                    <p className="text-base font-bold text-gray-900">
                      {(listing.price / 100).toFixed(2)} <span className="text-xs font-normal text-gray-500">RON</span>
                    </p>
                    <p className="text-sm text-gray-600 truncate mt-0.5">{listing.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{listing.size} · {listing.brand || listing.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
              <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No listings yet. Be the first to sell!</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 h-10 px-6 bg-teal-500 text-white rounded-full text-sm font-medium hover:bg-teal-600 transition"
              >
                Start selling
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-8">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Upload', desc: 'Snap a photo, set a price, and list your item in seconds' },
              { step: '2', title: 'Sell', desc: 'Buyers can purchase or make offers. Chat to negotiate.' },
              { step: '3', title: 'Ship & earn', desc: 'Ship with a pre-paid label. Get paid once delivered.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center">
                <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm mb-3">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
