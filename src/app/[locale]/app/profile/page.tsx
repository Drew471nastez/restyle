'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { signOut } from '@/actions/auth';
import {
  User,
  Camera,
  Settings,
  Star,
  Package,
  Heart,
  Bookmark,
  Plus,
  LogOut,
  Loader2,
} from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  last_active_at: string | null;
}

interface ListingItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  status: string;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'selling' | 'likes' | 'saves'>('selling');
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [favorites, setFavorites] = useState<ListingItem[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile(data);
          setEditDisplayName(data.display_name || '');
          setEditBio(data.bio || '');
        }

        // Fetch listings
        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, title, price, currency, images, status')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        if (listingsData) setListings(listingsData);

        // Fetch favorites
        const { data: favsData } = await supabase
          .from('favorites')
          .select('listing_id, listings(id, title, price, currency, images, status)')
          .eq('user_id', user.id);
        if (favsData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFavorites(favsData.map((f: any) => f.listings).filter(Boolean));
        }

        // Fetch follower/following counts
        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);
        setFollowerCount(followers || 0);

        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);
        setFollowingCount(following || 0);

        // Update last_active_at
        await supabase
          .from('profiles')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/avatar.${fileExt}`;

      await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      setProfile({ ...profile, avatar_url: publicUrl });
    } catch {
      // silently fail
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ display_name: editDisplayName || null, bio: editBio || null })
        .eq('id', profile.id);
      setProfile({ ...profile, display_name: editDisplayName || null, bio: editBio || null });
      setIsEditing(false);
    } catch {
      // silently fail
    } finally {
      setIsSaving(false);
    }
  };

  function getActiveStatus() {
    if (!profile?.last_active_at) return t('activeToday');
    const lastActive = new Date(profile.last_active_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / 60000);

    if (diffMinutes < 60) return t('activeToday');
    if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60);
      return t('lastActive', { time: `${hours}h` });
    }
    const days = Math.floor(diffMinutes / 1440);
    return t('lastActive', { time: `${days}d` });
  }

  const tabItems = [
    { key: 'selling' as const, label: t('selling'), icon: Package, count: listings.length },
    { key: 'likes' as const, label: t('likes'), icon: Heart, count: favorites.length },
    { key: 'saves' as const, label: t('saves'), icon: Bookmark, count: 0 },
  ];

  const activeItems = activeTab === 'selling' ? listings : activeTab === 'likes' ? favorites : [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      {/* Top bar with settings */}
      <div className="flex justify-end py-3">
        <Link
          href="/app/profile/settings"
          className="h-9 w-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pb-6">
        {/* Avatar */}
        <div className="relative mb-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center border-2 border-white shadow-md">
              <User className="h-10 w-10 text-teal-500" />
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-teal-500 text-white hover:bg-teal-600 transition shadow-sm"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Username */}
        <h1 className="text-lg font-bold text-gray-900">@{profile?.username}</h1>

        {/* Active status */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-xs text-gray-500">{getActiveStatus()}</span>
        </div>

        {/* Followers / Following */}
        <div className="flex items-center gap-4 mt-3">
          <button className="text-center">
            <span className="text-sm font-semibold text-gray-900">{followerCount}</span>
            <span className="text-xs text-gray-500 ml-1">{t('followers')}</span>
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <button className="text-center">
            <span className="text-sm font-semibold text-gray-900">{followingCount}</span>
            <span className="text-xs text-gray-500 ml-1">{t('following')}</span>
          </button>
        </div>

        {/* Stars */}
        {(profile?.rating_count ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= Math.round(profile?.rating_avg || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({profile?.rating_count})</span>
          </div>
        )}

        {/* Bio */}
        {isEditing ? (
          <div className="mt-4 w-full max-w-sm space-y-3">
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={t('bioPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
            />
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-full hover:bg-teal-600 disabled:opacity-50 transition"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('saveChanges')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {profile?.display_name && (
              <p className="text-sm font-medium text-gray-700 mt-3">{profile.display_name}</p>
            )}
            {profile?.bio && (
              <p className="text-sm text-gray-500 mt-1 max-w-xs">{profile.bio}</p>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="mt-3 text-xs font-medium text-teal-500 hover:text-teal-600 transition"
            >
              {t('editProfile')}
            </button>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="text-xs text-gray-400">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activeItems.map((item) => (
              <Link
                key={item.id}
                href={`/item/${item.id}`}
                className="group rounded-lg overflow-hidden border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="h-8 w-8" />
                    </div>
                  )}
                  {item.status === 'sold' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">{t('sold')}</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-bold text-gray-900">
                    {(item.price / 100).toFixed(2)} <span className="text-xs font-normal text-gray-500">{item.currency || 'RON'}</span>
                  </p>
                  <p className="text-xs text-gray-500 truncate">{item.title}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            {activeTab === 'selling' ? (
              <>
                <Package className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-1">{t('startSellingCTA')}</p>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                  {t('startSellingDescription')}
                </p>
                <Link
                  href="/app/sell"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-full hover:bg-teal-600 transition"
                >
                  <Plus className="h-4 w-4" />
                  {t('listAnItem')}
                </Link>
              </>
            ) : (
              <>
                <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                <p className="text-sm text-gray-500">{t('noLikes')}</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div className="border-t border-gray-200 pt-6 mt-2">
        <h2 className="text-base font-semibold text-gray-900 mb-4">{t('reviewsTitle')}</h2>
        {(profile?.rating_count ?? 0) > 0 ? (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${star <= Math.round(profile?.rating_avg || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              {profile?.rating_avg?.toFixed(1)} ({profile?.rating_count} {t('reviews')})
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t('noReviews')}</p>
        )}
      </div>

      {/* Logout */}
      <div className="border-t border-gray-200 pt-6 mt-6 pb-8">
        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </button>
        </form>
      </div>
    </div>
  );
}
