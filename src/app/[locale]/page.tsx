import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ShieldCheck, Truck, CreditCard } from 'lucide-react';

export default async function HomePage() {
  const t = await getTranslations();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let listings: any[] = [];
  try {
    const supabase = await createServerClient();
    const { data: featuredListings } = await supabase
      .from('listings')
      .select('*, profiles!seller_id(username, avatar_url)')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8);
    listings = featuredListings || [];
  } catch {
    // Supabase not configured or unreachable
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            {t('common.appName')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('common.tagline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-green-700 transition-colors"
            >
              {t('nav.browse')}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-600 border-2 border-green-600 px-8 py-3 rounded-full text-lg font-medium hover:bg-green-50 transition-colors"
            >
              {t('common.sell')}
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">Your money is held safely until you confirm delivery</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Shipping</h3>
              <p className="text-gray-600">Pre-paid shipping labels and locker delivery options</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Payouts</h3>
              <p className="text-gray-600">Get paid directly to your bank account</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Latest Items</h2>
            <Link
              href="/browse"
              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              {t('common.seeAll')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/item/${listing.id}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                    {listing.images[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    {listing.is_featured && (
                      <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        {t('listing.featured')}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-gray-900">
                      {(listing.price / 100).toFixed(2)} {listing.currency}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{listing.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{listing.size}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-4">No listings yet. Be the first to sell!</p>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-full font-medium hover:bg-green-700 transition-colors"
              >
                {t('common.sell')}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('browse.categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { slug: 'women', label: t('categories.women'), emoji: '👗' },
              { slug: 'men', label: t('categories.men'), emoji: '👔' },
              { slug: 'kids', label: t('categories.kids'), emoji: '🧸' },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/browse?category=${cat.slug}`}
                className="flex items-center gap-4 p-6 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors group"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-lg font-medium text-gray-900 group-hover:text-green-700">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
