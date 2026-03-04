import { createServerClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ProfilePageProps {
  params: { id: string };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const t = await getTranslations('profile');
  const supabase = await createServerClient();

  // Fetch profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  // Fetch active listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('seller_id', params.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  // Fetch reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles!reviewer_id(username, avatar_url)')
    .eq('reviewee_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch follow counts
  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', params.id);

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', params.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-200">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
              {profile.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h1 className="text-2xl font-bold text-gray-900">{profile.username}</h1>
            {profile.is_verified && (
              <Badge variant="default">{t('verified')}</Badge>
            )}
            {profile.is_pro && (
              <Badge variant="outline">PRO</Badge>
            )}
          </div>

          {profile.bio && (
            <p className="mt-2 text-sm text-gray-600">{profile.bio}</p>
          )}

          <div className="mt-3 flex items-center justify-center gap-6 sm:justify-start">
            {profile.rating_avg !== null && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">&#9733;</span>
                <span className="font-medium">{Number(profile.rating_avg).toFixed(1)}</span>
                <span className="text-gray-500">({profile.rating_count} {t('reviews')})</span>
              </div>
            )}
            <div className="text-sm">
              <span className="font-medium">{followersCount || 0}</span>{' '}
              <span className="text-gray-500">{t('followers')}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{followingCount || 0}</span>{' '}
              <span className="text-gray-500">{t('following')}</span>
            </div>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            {t('memberSince', { date: new Date(profile.created_at).toLocaleDateString() })}
          </p>
        </div>
      </div>

      {/* Listings */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('listings')} ({listings?.length || 0})
        </h2>

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
                  <p className="text-xs text-gray-500">{listing.size}</p>
                  <p className="mt-1 text-sm font-bold text-green-700">
                    {(listing.price / 100).toFixed(2)} RON
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('noListings')}</p>
        )}
      </section>

      {/* Reviews */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('reviewsTitle')} ({profile.rating_count || 0})
        </h2>

        {reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      {review.profiles?.avatar_url ? (
                        <img
                          src={review.profiles.avatar_url}
                          alt={review.profiles.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-gray-400">
                          {review.profiles?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {review.profiles?.username}
                        </span>
                        <div className="flex items-center text-yellow-500">
                          {Array.from({ length: 5 }, (_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>
                              &#9733;
                            </span>
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('noReviews')}</p>
        )}
      </section>
    </div>
  );
}
