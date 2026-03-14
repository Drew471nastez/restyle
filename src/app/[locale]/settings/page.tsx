'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  updateProfile,
  changeUsername,
  uploadAvatar,
  updateNotificationPrefs,
  updatePrivacySettings,
  updateSellerPreferences,
  addShippingAddress,
  deleteShippingAddress,
  toggleHolidayMode,
  deactivateAccount,
  requestAccountDeletion,
} from '@/actions/user';
import {
  Camera, Loader2, User, ChevronRight, Shield, Bell,
  CreditCard, Truck, MapPin, Lock, Trash2, CheckCircle2, XCircle,
  Package, Eye, AlertTriangle, Download, Palmtree, Plus, X,
} from 'lucide-react';
import type { ShippingAddress, NotificationPreferences, PrivacySettings, SellerPreferences } from '@/types/database';

const SIDEBAR_ITEMS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Shield },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'seller', label: 'Seller', icon: Package },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'danger', label: 'Account control', icon: AlertTriangle },
];

interface ProfileData {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  country: string;
  avatar_url: string | null;
  phone: string | null;
  is_verified: boolean;
  holiday_mode: boolean;
  accepted_seller_terms_at: string | null;
  username_changed_at: string | null;
}

interface Toast { type: 'success' | 'error'; msg: string }

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Sub-data
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacySettings | null>(null);
  const [sellerPrefs, setSellerPrefs] = useState<SellerPreferences | null>(null);

  // Edit states
  const [editUsername, setEditUsername] = useState('');
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Address form
  const [addrForm, setAddrForm] = useState({
    label: 'Home', full_name: '', street_line_1: '', street_line_2: '',
    city: '', state_province: '', postal_code: '', country: 'RO',
    phone: '', is_default: true, is_return_address: false,
  });

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setUserEmail(user.email || '');

    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (p) {
      setProfile(p as ProfileData);
      setEditUsername(p.username || '');
    }

    // Load sub-tables (silently handle missing tables)
    try { const { data } = await supabase.from('shipping_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }); if (data) setAddresses(data); } catch {}
    try { const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).single(); if (data) setNotifPrefs(data); } catch {}
    try { const { data } = await supabase.from('privacy_settings').select('*').eq('user_id', user.id).single(); if (data) setPrivacyPrefs(data); } catch {}
    try { const { data } = await supabase.from('seller_preferences').select('*').eq('user_id', user.id).single(); if (data) setSellerPrefs(data); } catch {}

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('error', 'Image must be under 5MB'); return; }

    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const result = await uploadAvatar(fd);
    setUploadingAvatar(false);

    if (result.error) { showToast('error', result.error); return; }
    if (result.url && profile) {
      setProfile({ ...profile, avatar_url: result.url });
      showToast('success', 'Profile photo updated');
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const result = await updateProfile({
      display_name: profile.display_name,
      bio: profile.bio,
      city: profile.city,
      country: profile.country,
      phone: profile.phone,
    });
    setSaving(false);
    if (result.error) showToast('error', result.error);
    else showToast('success', 'Profile updated');
  }

  async function handleChangeUsername() {
    setSaving(true);
    const result = await changeUsername({ username: editUsername });
    setSaving(false);
    if (result.error) { showToast('error', result.error); return; }
    if (profile) setProfile({ ...profile, username: editUsername, username_changed_at: new Date().toISOString() });
    setShowUsernameEdit(false);
    showToast('success', 'Username changed');
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
    const confirm = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;
    if (newPassword !== confirm) { showToast('error', 'Passwords do not match'); return; }
    if (newPassword.length < 8) { showToast('error', 'Password must be at least 8 characters'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      form.reset();
      showToast('success', 'Password changed');
    } catch { showToast('error', 'Failed to change password'); }
    finally { setSaving(false); }
  }

  async function handleSaveNotifs() {
    if (!notifPrefs) return;
    setSaving(true);
    const { user_id, updated_at, ...prefs } = notifPrefs;
    void user_id; void updated_at;
    const result = await updateNotificationPrefs(prefs);
    setSaving(false);
    if (result.error) showToast('error', result.error);
    else showToast('success', 'Notification preferences saved');
  }

  async function handleSavePrivacy() {
    if (!privacyPrefs) return;
    setSaving(true);
    const { user_id: pUid, updated_at: pUpd, ...settings } = privacyPrefs;
    void pUid; void pUpd;
    const result = await updatePrivacySettings(settings);
    setSaving(false);
    if (result.error) showToast('error', result.error);
    else showToast('success', 'Privacy settings saved');
  }

  async function handleSaveSellerPrefs() {
    if (!sellerPrefs) return;
    setSaving(true);
    const { user_id: sUid, updated_at: sUpd, ...sprefs } = sellerPrefs;
    void sUid; void sUpd;
    const result = await updateSellerPreferences(sprefs);
    setSaving(false);
    if (result.error) showToast('error', result.error);
    else showToast('success', 'Seller preferences saved');
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await addShippingAddress(addrForm);
    setSaving(false);
    if (result.error) { showToast('error', result.error); return; }
    setShowAddAddress(false);
    setAddrForm({ label: 'Home', full_name: '', street_line_1: '', street_line_2: '', city: '', state_province: '', postal_code: '', country: 'RO', phone: '', is_default: true, is_return_address: false });
    loadData();
    showToast('success', 'Address added');
  }

  async function handleDeleteAddress(id: string) {
    const result = await deleteShippingAddress(id);
    if (result.error) showToast('error', result.error);
    else { setAddresses((a) => a.filter((addr) => addr.id !== id)); showToast('success', 'Address removed'); }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>;
  }

  if (!profile) return null;

  const canChangeUsername = !profile.username_changed_at || (Date.now() - new Date(profile.username_changed_at).getTime()) > 30 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium ${
          toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-800' : 'bg-white border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0" /> : <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="md:w-56 shrink-0">
            <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden md:block hidden">
              {SIDEBAR_ITEMS.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors ${i < SIDEBAR_ITEMS.length - 1 ? 'border-b border-gray-100' : ''} ${
                    activeTab === item.id ? 'bg-violet-50 text-violet-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${activeTab === item.id ? 'text-violet-500' : 'text-gray-400'}`} />
                  {item.label}
                  <ChevronRight className={`h-4 w-4 ml-auto ${activeTab === item.id ? 'text-violet-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </nav>

            {/* Mobile select */}
            <select value={activeTab} onChange={(e) => setActiveTab(e.target.value)} className="md:hidden w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none">
              {SIDEBAR_ITEMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* ── PROFILE ──────────────────────────────────────── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Avatar */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Profile photo</h2>
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                        {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="h-8 w-8 text-gray-400" /></div>}
                      </div>
                      {uploadingAvatar && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><Loader2 className="h-5 w-5 text-white animate-spin" /></div>}
                    </div>
                    <div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
                        <Camera className="h-4 w-4" />{uploadingAvatar ? 'Uploading...' : 'Change photo'}
                      </button>
                      <p className="text-xs text-gray-400 mt-1.5">JPG, PNG or WebP. Max 5MB.</p>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} className="hidden" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900">Personal information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
                      <input type="text" value={profile.display_name || ''} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="Your name" maxLength={60} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
                      <p className="text-xs text-gray-400 mt-1">This is shown on your profile and listings</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                          <input type="text" value={profile.username} disabled className="w-full rounded-lg border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed" />
                        </div>
                        {canChangeUsername && (
                          <button type="button" onClick={() => setShowUsernameEdit(true)} className="shrink-0 h-10 px-3 rounded-lg border border-gray-200 text-xs font-medium text-violet-600 hover:bg-violet-50 transition">
                            Change
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{canChangeUsername ? 'You can change your username once every 30 days' : 'Username was recently changed'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
                    <textarea value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell others about yourself and your style..." rows={3} maxLength={500} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none" />
                    <p className="text-xs text-gray-400 mt-1 text-right">{(profile.bio || '').length}/500</p>
                  </div>
                </div>

                {/* Location */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /><h2 className="text-sm font-semibold text-gray-900">Location</h2></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                      <select value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none bg-white">
                        {[['RO', 'Romania'], ['GB', 'United Kingdom'], ['FR', 'France'], ['DE', 'Germany'], ['IT', 'Italy'], ['ES', 'Spain'], ['NL', 'Netherlands'], ['BE', 'Belgium'], ['PL', 'Poland'], ['PT', 'Portugal'], ['SE', 'Sweden'], ['AT', 'Austria'], ['HU', 'Hungary'], ['BG', 'Bulgaria'], ['CZ', 'Czech Republic']].map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                      <input type="text" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="Your city" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Your city helps buyers estimate shipping costs and delivery times</p>
                </div>

                <button type="submit" disabled={saving} className="flex items-center gap-2 h-10 px-6 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 transition-colors">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{saving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            )}

            {/* ── ACCOUNT ──────────────────────────────────────── */}
            {activeTab === 'account' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Email address</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{userEmail}</p>
                      <div className="flex items-center gap-1.5 mt-1"><CheckCircle2 className="h-3.5 w-3.5 text-violet-500" /><span className="text-xs text-violet-600 font-medium">Verified</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Phone number</h2>
                  <p className="text-xs text-gray-400 mb-3">Optional. May be required for payout verification.</p>
                  <div className="flex gap-3">
                    <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+40 123 456 789" className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" />
                    <button onClick={async () => { setSaving(true); await updateProfile({ phone: profile.phone }); setSaving(false); showToast('success', 'Phone saved'); }} className="h-10 px-4 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition">Save</button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Connected accounts</h2>
                  <p className="text-xs text-gray-400 mb-3">Social accounts linked to your ReStyle account</p>
                  <div className="flex items-center justify-between py-3 border-t border-gray-100">
                    <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"><svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg></div><span className="text-sm font-medium text-gray-700">Google</span></div>
                    <span className="text-xs text-gray-400">Not connected</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── SHIPPING ─────────────────────────────────────── */}
            {activeTab === 'shipping' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div><h2 className="text-sm font-semibold text-gray-900">Shipping addresses</h2><p className="text-xs text-gray-400 mt-0.5">Used for deliveries and returns</p></div>
                    <button onClick={() => setShowAddAddress(true)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 transition"><Plus className="h-3.5 w-3.5" />Add address</button>
                  </div>

                  {addresses.length === 0 ? (
                    <div className="text-center py-8"><Truck className="h-10 w-10 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-500">No addresses yet</p><p className="text-xs text-gray-400 mt-1">Add a shipping address to start buying</p></div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div key={addr.id} className="flex items-start justify-between p-4 border border-gray-100 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                              {addr.is_default && <span className="text-[10px] font-medium bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">Default</span>}
                              {addr.is_return_address && <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Return</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{addr.full_name}</p>
                            <p className="text-xs text-gray-500">{addr.street_line_1}{addr.street_line_2 ? `, ${addr.street_line_2}` : ''}</p>
                            <p className="text-xs text-gray-500">{addr.city}, {addr.postal_code}, {addr.country}</p>
                          </div>
                          <button onClick={() => handleDeleteAddress(addr.id)} className="text-gray-400 hover:text-red-500 transition p-1"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showAddAddress && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Add new address</h3>
                    <form onSubmit={handleAddAddress} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Label</label><input type="text" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" placeholder="Home" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Full name *</label><input type="text" value={addrForm.full_name} onChange={(e) => setAddrForm({ ...addrForm, full_name: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                      </div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Street address *</label><input type="text" value={addrForm.street_line_1} onChange={(e) => setAddrForm({ ...addrForm, street_line_1: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Apartment, suite, etc.</label><input type="text" value={addrForm.street_line_2} onChange={(e) => setAddrForm({ ...addrForm, street_line_2: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">City *</label><input type="text" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Postal code *</label><input type="text" value={addrForm.postal_code} onChange={(e) => setAddrForm({ ...addrForm, postal_code: e.target.value })} required className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                        <div><label className="block text-xs font-medium text-gray-600 mb-1">Country *</label><select value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">{[['RO','Romania'],['GB','UK'],['FR','France'],['DE','Germany'],['PL','Poland']].map(([c,l]) => <option key={c} value={c}>{l}</option>)}</select></div>
                      </div>
                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addrForm.is_default} onChange={(e) => setAddrForm({ ...addrForm, is_default: e.target.checked })} className="rounded" />Default address</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addrForm.is_return_address} onChange={(e) => setAddrForm({ ...addrForm, is_return_address: e.target.checked })} className="rounded" />Return address</label>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button type="button" onClick={() => setShowAddAddress(false)} className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={saving} className="h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60">{saving ? 'Saving...' : 'Save address'}</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ── PAYMENTS ─────────────────────────────────────── */}
            {activeTab === 'payments' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Wallet & payouts</h2>
                  <p className="text-sm text-gray-500 mb-4">Add your IBAN to receive payouts when you sell items. Payouts are processed within 2-3 business days.</p>
                  <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition"><CreditCard className="h-4 w-4" />Set up payouts</button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Saved payment methods</h2>
                  <p className="text-xs text-gray-400">Payment methods are securely stored by Stripe. No card data is stored on our servers.</p>
                  <div className="text-center py-6"><CreditCard className="h-8 w-8 text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-500">No payment methods saved yet</p></div>
                </div>
              </div>
            )}

            {/* ── SELLER PREFERENCES ───────────────────────────── */}
            {activeTab === 'seller' && (
              <div className="space-y-5">
                {/* Holiday mode */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><Palmtree className="h-5 w-5 text-amber-500" /><div><h2 className="text-sm font-semibold text-gray-900">Holiday mode</h2><p className="text-xs text-gray-400 mt-0.5">Pause your listings while you are away</p></div></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={profile.holiday_mode} onChange={async (e) => { const enabled = e.target.checked; setProfile({ ...profile, holiday_mode: enabled }); await toggleHolidayMode(enabled); showToast('success', enabled ? 'Holiday mode on' : 'Holiday mode off'); }} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                    </label>
                  </div>
                </div>

                {/* Bundle discounts */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-900">Bundle discounts</h2>
                  <p className="text-xs text-gray-400">Offer a discount when buyers purchase multiple items from you</p>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700">Enable bundle discounts</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={sellerPrefs?.bundle_discount_enabled ?? false} onChange={(e) => setSellerPrefs((p) => p ? { ...p, bundle_discount_enabled: e.target.checked } : p)} className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                    </label>
                  </div>
                  {sellerPrefs?.bundle_discount_enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Discount (%)</label><input type="number" min={5} max={50} value={sellerPrefs.bundle_discount_percent} onChange={(e) => setSellerPrefs((p) => p ? { ...p, bundle_discount_percent: parseInt(e.target.value) || 0 } : p)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                      <div><label className="block text-xs font-medium text-gray-600 mb-1">Min items</label><input type="number" min={2} max={10} value={sellerPrefs.bundle_min_items} onChange={(e) => setSellerPrefs((p) => p ? { ...p, bundle_min_items: parseInt(e.target.value) || 2 } : p)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" /></div>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-2">
                    <div><span className="text-sm text-gray-700">Shipping turnaround (days)</span><p className="text-xs text-gray-400">How quickly you typically ship items</p></div>
                    <input type="number" min={1} max={14} value={sellerPrefs?.shipping_turnaround_days ?? 3} onChange={(e) => setSellerPrefs((p) => p ? { ...p, shipping_turnaround_days: parseInt(e.target.value) || 3 } : p)} className="w-16 rounded-lg border border-gray-200 px-3 py-2 text-sm text-center" />
                  </div>
                  <button onClick={handleSaveSellerPrefs} disabled={saving} className="flex items-center gap-2 h-9 px-5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 transition">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save preferences
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS ─────────────────────────────────── */}
            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  <div className="px-6 py-4"><h2 className="text-sm font-semibold text-gray-900">Email notifications</h2><p className="text-xs text-gray-400 mt-0.5">Choose which emails you want to receive</p></div>
                  {[
                    { key: 'email_messages', label: 'New messages', desc: 'When someone sends you a message' },
                    { key: 'email_orders', label: 'Order updates', desc: 'Shipping confirmations, delivery updates' },
                    { key: 'email_offers', label: 'Offers received', desc: 'When a buyer makes an offer on your item' },
                    { key: 'email_price_drops', label: 'Price drops', desc: 'When favorited items drop in price' },
                    { key: 'email_marketing', label: 'Tips & promotions', desc: 'ReStyle news, selling tips, and special offers' },
                    { key: 'email_security', label: 'Security alerts', desc: 'Login attempts, password changes (always on)', alwaysOn: true },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between px-6 py-4">
                      <div><p className="text-sm font-medium text-gray-900">{item.label}</p><p className="text-xs text-gray-500 mt-0.5">{item.desc}</p></div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={notifPrefs?.[item.key as keyof NotificationPreferences] as boolean ?? true} disabled={'alwaysOn' in item} onChange={(e) => setNotifPrefs((p) => p ? { ...p, [item.key]: e.target.checked } : p)} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500 peer-disabled:opacity-60"></div>
                      </label>
                    </div>
                  ))}
                </div>
                <button onClick={handleSaveNotifs} disabled={saving} className="flex items-center gap-2 h-10 px-6 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 transition">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save preferences
                </button>
              </div>
            )}

            {/* ── PRIVACY ──────────────────────────────────────── */}
            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  <div className="px-6 py-4"><h2 className="text-sm font-semibold text-gray-900">Privacy settings</h2><p className="text-xs text-gray-400 mt-0.5">Control what others can see about you</p></div>
                  {[
                    { key: 'show_city', label: 'Show city on profile', desc: 'Helps buyers estimate shipping' },
                    { key: 'show_online_status', label: 'Show online status', desc: 'Let others see when you are online' },
                    { key: 'show_last_active', label: 'Show last active', desc: 'Show when you were last active' },
                    { key: 'allow_search_engines', label: 'Search engine indexing', desc: 'Allow Google to show your profile in search results' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between px-6 py-4">
                      <div><p className="text-sm font-medium text-gray-900">{item.label}</p><p className="text-xs text-gray-500 mt-0.5">{item.desc}</p></div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={privacyPrefs?.[item.key as keyof PrivacySettings] as boolean ?? true} onChange={(e) => setPrivacyPrefs((p) => p ? { ...p, [item.key]: e.target.checked } : p)} className="sr-only peer" />
                        <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                      </label>
                    </div>
                  ))}
                  <div className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div><p className="text-sm font-medium text-gray-900">Who can message you</p><p className="text-xs text-gray-500 mt-0.5">Control who can start conversations with you</p></div>
                      <select value={privacyPrefs?.allow_messages_from || 'everyone'} onChange={(e) => setPrivacyPrefs((p) => p ? { ...p, allow_messages_from: e.target.value } : p)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                        <option value="everyone">Everyone</option><option value="verified">Verified users</option><option value="nobody">Nobody</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button onClick={handleSavePrivacy} disabled={saving} className="flex items-center gap-2 h-10 px-6 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 transition">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save settings
                </button>
              </div>
            )}

            {/* ── SECURITY ─────────────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-4">Change password</h2>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label><input name="newPassword" type="password" minLength={8} required placeholder="Min. 8 characters, at least 1 letter and 1 number" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label><input name="confirmPassword" type="password" minLength={8} required placeholder="Repeat password" className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" /></div>
                    <button type="submit" disabled={saving} className="flex items-center gap-2 h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60 transition">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Update password</button>
                  </form>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Two-factor authentication</h2>
                  <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account. Coming soon.</p>
                  <button disabled className="h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-400 cursor-not-allowed">Enable 2FA (coming soon)</button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Active sessions</h2>
                  <p className="text-sm text-gray-500">Session management will be available in a future update.</p>
                </div>
              </div>
            )}

            {/* ── DANGER ZONE ──────────────────────────────────── */}
            {activeTab === 'danger' && (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Download your data</h2>
                  <p className="text-xs text-gray-500 mb-4">Request a copy of all your ReStyle data. This may take a few minutes.</p>
                  <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"><Download className="h-4 w-4" />Request data export</button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Deactivate account</h2>
                  <p className="text-xs text-gray-500 mb-4">Temporarily hide your profile and listings. You can reactivate anytime by logging in.</p>
                  <button onClick={async () => { await deactivateAccount(); router.push('/'); }} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-50 transition"><Palmtree className="h-4 w-4" />Deactivate account</button>
                </div>
                <div className="bg-white rounded-xl border border-red-100 p-6">
                  <h2 className="text-sm font-semibold text-red-700 mb-2">Delete account permanently</h2>
                  <p className="text-xs text-gray-500 mb-4">This action is irreversible. Your profile, listings, and data will be permanently removed. Active orders must be completed first.</p>
                  {!showDeleteConfirm ? (
                    <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"><Trash2 className="h-4 w-4" />Delete my account</button>
                  ) : (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-3">Are you absolutely sure? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)} className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700">Cancel</button>
                        <button onClick={async () => { const result = await requestAccountDeletion(); if (result.error) { showToast('error', result.error); setShowDeleteConfirm(false); } else { router.push('/login'); } }} className="h-9 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">Yes, delete my account</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Username change modal */}
      {showUsernameEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Change username</h3>
            <p className="text-sm text-gray-500 mb-4">You can only change your username once every 30 days. Your old username will become available to others.</p>
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} maxLength={30} className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowUsernameEdit(false)} className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleChangeUsername} disabled={saving || editUsername === profile.username} className="flex-1 h-10 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60">
                {saving ? 'Saving...' : 'Change username'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
