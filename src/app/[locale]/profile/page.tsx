'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  MapPin,
  Shield,
  Calendar,
  Pencil,
} from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
  country: string;
  city: string | null;
  is_verified: boolean;
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
  views_count: number;
  favorites_count: number;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const supabase = useMemo(() => createClient(), []);
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
    let cancelled = false;

    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (data) {
          setProfile(data);
          setEditDisplayName(data.display_name || '');
          setEditBio(data.bio || '');
        }

        const { data: listingsData } = await supabase
          .from('listings')
          .select('id, title, price, currency, images, status, views_count, favorites_count')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        if (!cancelled && listingsData) setListings(listingsData);

        const { data: favsData } = await supabase
          .from('favorites')
          .select('listing_id, listings(id, title, price, currency, images, status, views_count, favorites_count)')
          .eq('user_id', user.id);
        if (!cancelled && favsData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setFavorites(favsData.map((f: any) => f.listings).filter(Boolean));
        }

        const { count: followers } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);
        if (!cancelled) setFollowerCount(followers || 0);

        const { count: following } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id);
        if (!cancelled) setFollowingCount(following || 0);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
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
    if (diffMinutes < 1440) return t('lastActive', { time: `${Math.floor(diffMinutes / 60)}h` });
    return t('lastActive', { time: `${Math.floor(diffMinutes / 1440)}d` });
  }

  function getMemberSince() {
    if (!profile?.created_at) return '';
    const d = new Date(profile.created_at);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const tabItems = [
    { key: 'selling' as const, label: t('selling'), icon: Package, count: listings.length },
    { key: 'likes' as const, label: t('likes'), icon: Heart, count: favorites.length },
    { key: 'saves' as const, label: t('saves'), icon: Bookmark, count: 0 },
  ];

  const activeItems = activeTab === 'selling' ? listings : activeTab === 'likes' ? favorites : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Profile skeleton */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-full bg-gray-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-11 bg-gray-200 rounded-xl animate-pulse mb-6" />
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex border-b border-gray-200 mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 py-3 flex justify-center">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="aspect-[3/4] bg-gray-200 rounded-xl animate-pulse" />
                  <div className="mt-2 space-y-1">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 pb-24">
        {/* Top bar */}
        <div className="flex justify-end py-3">
          <Link href="/settings" className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition">
            <Settings className="h-5 w-5" />
          </Link>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="h-20 w-20 rounded-full object-cover border-2 border-gray-100" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-violet-100 flex items-center justify-center border-2 border-gray-100">
                  <User className="h-8 w-8 text-violet-500" />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-violet-500 text-white hover:bg-violet-600 transition"
              >
                <Camera className="h-3 w-3" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 truncate">{profile?.display_name || profile?.username}</h1>
                {profile?.is_verified && <Shield className="h-4 w-4 text-violet-500 shrink-0" />}
              </div>
              <p className="text-sm text-gray-500">@{profile?.username}</p>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-xs text-gray-500">{getActiveStatus()}</span>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm">
                <span><strong className="text-gray-900">{followerCount}</strong> <span className="text-gray-500">{t('followers')}</span></span>
                <span><strong className="text-gray-900">{followingCount}</strong> <span className="text-gray-500">{t('following')}</span></span>
                {(profile?.rating_count ?? 0) > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <strong className="text-gray-900">{profile?.rating_avg?.toFixed(1)}</strong>
                    <span className="text-gray-500">({profile?.rating_count})</span>
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="hidden sm:flex shrink-0 items-center gap-1.5 h-9 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('editProfile')}
            </button>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="sm:hidden flex items-center justify-center gap-1.5 w-full mt-4 h-9 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('editProfile')}
          </button>

          {isEditing ? (
            <div className="mt-5 pt-5 border-t border-gray-100 space-y-3">
              <input
                type="text"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder={t('displayNamePlaceholder')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder={t('bioPlaceholder')}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  {t('cancel')}
                </button>
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-violet-500 rounded-lg hover:bg-violet-600 disabled:opacity-50 transition">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('saveChanges')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {profile?.bio && (
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">{profile.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                {profile?.country && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Member since {getMemberSince()}</span>
              </div>
            </>
          )}
        </div>

        {/* Sell CTA */}
        <Link href="/sell" className="flex items-center justify-center gap-2 w-full h-11 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition mb-6">
          <Plus className="h-4 w-4" />
          {t('listAnItem')}
        </Link>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                  activeTab === tab.key ? 'border-violet-500 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count > 0 && <span className="text-xs text-gray-400">({tab.count})</span>}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeItems.map((item) => (
                  <Link key={item.id} href={`/item/${item.id}`} className="group">
                    <div className="aspect-[3/4] bg-gray-100 rounded-xl relative overflow-hidden">
                      {item.images?.[0] ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="h-8 w-8" /></div>
                      )}
                      {item.status === 'sold' && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-sm font-semibold">{t('sold')}</span></div>
                      )}
                      {item.status === 'draft' && (
                        <span className="absolute top-2 left-2 text-[10px] font-medium bg-gray-800 text-white px-1.5 py-0.5 rounded">Draft</span>
                      )}
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <p className="text-sm font-bold text-gray-900">{(item.price / 100).toFixed(2)} <span className="text-xs font-normal text-gray-500">{item.currency || 'RON'}</span></p>
                      <p className="text-xs text-gray-500 truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        <span>{item.views_count || 0} views</span>
                        <span>{item.favorites_count || 0} fav</span>
                      </div>
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
                    <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">{t('startSellingDescription')}</p>
                    <Link href="/sell" className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition">
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
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('reviewsTitle')}</h2>
          {(profile?.rating_count ?? 0) > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(profile?.rating_avg || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-600">{profile?.rating_avg?.toFixed(1)} ({profile?.rating_count} {t('reviews')})</span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('noReviews')}</p>
          )}
        </div>

        {/* Logout */}
        <div className="mt-6 pb-8">
          <form action={signOut}>
            <button type="submit" className="inline-flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition">
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
