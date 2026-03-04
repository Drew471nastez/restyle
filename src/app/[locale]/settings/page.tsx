'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Camera, Loader2, User, ChevronRight, Shield, Bell,
  CreditCard, Truck, MapPin, Lock, Trash2, CheckCircle2, XCircle,
} from 'lucide-react';

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Profile details', icon: User },
  { id: 'account', label: 'Account settings', icon: Shield },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Lock },
];

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  country: string;
  avatar_url: string | null;
  phone: string | null;
  is_verified: boolean;
}

interface Toast { type: 'success' | 'error'; msg: string }

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<Profile>({
    id: '',
    username: '',
    display_name: '',
    bio: '',
    city: '',
    country: 'RO',
    avatar_url: '',
    phone: '',
    is_verified: false,
  });

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      setUserEmail(user.email || '');
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile({
          id: data.id,
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          city: data.city || '',
          country: data.country || 'RO',
          avatar_url: data.avatar_url || '',
          phone: data.phone || '',
          is_verified: data.is_verified || false,
        });
      }
      setLoading(false);
    }
    load();
  }, [router, supabase]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile.id) return;
    if (file.size > 5 * 1024 * 1024) { showToast('error', 'Image must be under 5MB'); return; }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      showToast('success', 'Profile photo updated!');
    } catch {
      showToast('error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: profile.display_name || null,
        bio: profile.bio || null,
        city: profile.city || null,
        country: profile.country || 'RO',
        phone: profile.phone || null,
      }).eq('id', profile.id);

      if (error) throw error;
      showToast('success', 'Profile updated successfully!');
    } catch {
      showToast('error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

    if (newPassword !== confirm) { showToast('error', 'Passwords do not match.'); return; }
    if (newPassword.length < 8) { showToast('error', 'Password must be at least 8 characters.'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      form.reset();
      showToast('success', 'Password changed successfully!');
    } catch {
      showToast('error', 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-in slide-in-from-right-5 duration-300 ${
          toast.type === 'success'
            ? 'bg-white border-emerald-200 text-emerald-800'
            : 'bg-white border-red-200 text-red-800'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
            : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden md:block w-56 shrink-0">
            <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {SIDEBAR_ITEMS.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors ${
                    i < SIDEBAR_ITEMS.length - 1 ? 'border-b border-gray-100' : ''
                  } ${
                    activeTab === item.id
                      ? 'bg-violet-50 text-violet-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${activeTab === item.id ? 'text-violet-500' : 'text-gray-400'}`} />
                  {item.label}
                  <ChevronRight className={`h-4 w-4 ml-auto ${activeTab === item.id ? 'text-violet-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile tabs */}
          <div className="md:hidden w-full mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
            >
              {SIDEBAR_ITEMS.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* PROFILE DETAILS */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile photo</h2>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4" />
                        {uploadingAvatar ? 'Uploading…' : 'Change photo'}
                      </button>
                      <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP · Max 5MB</p>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
                    </div>
                  </div>
                </div>

                {/* Info card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900">Personal information</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                      <input
                        type="text"
                        value={profile.display_name || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                        placeholder="Your full name"
                        maxLength={60}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                        <input
                          type="text"
                          value={profile.username}
                          disabled
                          className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Username cannot be changed</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                    <textarea
                      value={profile.bio || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Tell others about yourself…"
                      rows={3}
                      maxLength={200}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">{(profile.bio || '').length}/200</p>
                  </div>
                </div>

                {/* Location card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <h2 className="text-sm font-semibold text-gray-900">Location</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                      <select
                        value={profile.country}
                        onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                      >
                        {[
                          ['RO', '🇷🇴 Romania'], ['GB', '🇬🇧 United Kingdom'], ['FR', '🇫🇷 France'],
                          ['DE', '🇩🇪 Germany'], ['IT', '🇮🇹 Italy'], ['ES', '🇪🇸 Spain'],
                          ['NL', '🇳🇱 Netherlands'], ['BE', '🇧🇪 Belgium'], ['PL', '🇵🇱 Poland'],
                          ['PT', '🇵🇹 Portugal'], ['SE', '🇸🇪 Sweden'], ['AT', '🇦🇹 Austria'],
                          ['HU', '🇭🇺 Hungary'], ['BG', '🇧🇬 Bulgaria'], ['CZ', '🇨🇿 Czech Republic'],
                        ].map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={profile.city || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                        placeholder="Your city"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 h-10 px-6 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 transition-colors"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            )}

            {/* ACCOUNT SETTINGS */}
            {activeTab === 'account' && (
              <div className="space-y-5">
                {/* Email */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Email address</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{userEmail}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs text-purple-600 font-medium">Verified</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Phone number</h2>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+40 123 456 789"
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                    />
                    <button
                      onClick={async () => {
                        setSaving(true);
                        try {
                          await supabase.from('profiles').update({ phone: profile.phone || null }).eq('id', profile.id);
                          showToast('success', 'Phone number saved!');
                        } catch { showToast('error', 'Failed to save phone.'); }
                        finally { setSaving(false); }
                      }}
                      className="h-10 px-4 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Change password */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Change password</h2>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
                      <input
                        name="newPassword"
                        type="password"
                        minLength={8}
                        required
                        placeholder="Min. 8 characters"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        minLength={8}
                        required
                        placeholder="Repeat password"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Update password
                    </button>
                  </form>
                </div>

                {/* Danger zone */}
                <div className="bg-white rounded-xl border border-red-100 p-6">
                  <h2 className="text-sm font-semibold text-red-700 mb-2">Danger zone</h2>
                  <p className="text-xs text-gray-500 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                  <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition">
                    <Trash2 className="h-4 w-4" />
                    Delete my account
                  </button>
                </div>
              </div>
            )}

            {/* SHIPPING */}
            {activeTab === 'shipping' && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Shipping preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Default shipping country</label>
                    <select
                      value={profile.country}
                      onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                      className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white"
                    >
                      {[['RO', '🇷🇴 Romania'], ['GB', '🇬🇧 UK'], ['FR', '🇫🇷 France'], ['DE', '🇩🇪 Germany']].map(([code, label]) => (
                        <option key={code} value={code}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400">Buyers will see estimated shipping from this country when viewing your listings.</p>
                </div>
              </div>
            )}

            {/* PAYMENTS */}
            {activeTab === 'payments' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Wallet & payouts</h2>
                  <p className="text-sm text-gray-500 mb-4">Add your IBAN to receive payouts when you sell items.</p>
                  <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition">
                    <CreditCard className="h-4 w-4" />
                    Add bank account
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Saved cards</h2>
                  <p className="text-sm text-gray-400">No payment methods saved yet.</p>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-900">Email notifications</h2>
                </div>
                {[
                  { id: 'new_message', label: 'New messages', desc: 'When someone sends you a message', defaultOn: true },
                  { id: 'new_order', label: 'New orders', desc: 'When someone buys your item', defaultOn: true },
                  { id: 'price_drop', label: 'Price drops', desc: 'On favorited items', defaultOn: false },
                  { id: 'offers', label: 'Offers received', desc: 'When a buyer makes an offer', defaultOn: true },
                  { id: 'marketing', label: 'Tips & promotions', desc: 'ReStyle news and selling tips', defaultOn: false },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={item.defaultOn} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-900">Privacy settings</h2>
                </div>
                {[
                  { id: 'show_city', label: 'Show city on profile', desc: 'Let others see your city' },
                  { id: 'show_online', label: 'Show online status', desc: 'Let others see when you were last active' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
