'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  completeOnboardingProfile,
  completeOnboardingLocation,
  completeOnboarding,
  checkUsernameAvailability,
  uploadAvatar,
} from '@/actions/user';
import {
  User as UserIcon, Camera, Loader2, ArrowRight, ArrowLeft,
  CheckCircle2, MapPin, Sparkles, Check, X,
} from 'lucide-react';

type Step = 'profile' | 'location' | 'preferences';

const STEPS: Step[] = ['profile', 'location', 'preferences'];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<Step>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Profile fields
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Location fields
  const [country, setCountry] = useState('RO');
  const [city, setCity] = useState('');

  // Preferences
  const [interests, setInterests] = useState<string[]>([]);
  const [intent, setIntent] = useState<'buy' | 'sell' | 'both' | ''>('');

  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize from auth user
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const meta = user.user_metadata || {};
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // If onboarding is already complete, redirect
        if (profile.onboarding_step === 'complete') {
          router.push('/');
          return;
        }
        // Resume from where they left off
        setCurrentStep(profile.onboarding_step || 'profile');
        setUsername(profile.username || '');
        setDisplayName(profile.display_name || '');
        setBio(profile.bio || '');
        setAvatarPreview(profile.avatar_url || null);
        setCountry(profile.country || 'RO');
        setCity(profile.city || '');
      } else {
        // Pre-fill from auth metadata
        const defaultUsername = meta.username
          || user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '')
          || '';
        setUsername(defaultUsername);
        setDisplayName(meta.full_name || meta.name || '');
        if (meta.avatar_url || meta.picture) {
          setAvatarPreview(meta.avatar_url || meta.picture);
        }
      }
      setLoading(false);
    }
    init();
  }, [supabase, router]);

  // Debounced username check
  useEffect(() => {
    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);

    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    usernameCheckTimeout.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    }, 500);

    return () => {
      if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current);
    };
  }, [username]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  async function handleUploadAvatar() {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      await uploadAvatar(fd);
      setAvatarFile(null); // Mark as uploaded
    } catch {
      // Non-critical, continue
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleProfileSubmit() {
    setError('');
    if (username.length < 3) { setError(t('usernameTooShort')); return; }
    if (usernameStatus === 'taken') { setError(t('usernameTaken')); return; }

    setSaving(true);

    // Upload avatar if pending
    if (avatarFile) await handleUploadAvatar();

    const result = await completeOnboardingProfile({
      username: username.toLowerCase(),
      display_name: displayName || undefined,
      bio: bio || undefined,
    });

    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setCurrentStep('location');
  }

  async function handleLocationSubmit() {
    setError('');
    setSaving(true);

    const result = await completeOnboardingLocation({ country, city: city || undefined });

    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setCurrentStep('preferences');
  }

  async function handleFinish() {
    setError('');
    setSaving(true);

    const result = await completeOnboarding();

    setSaving(false);
    if (result.error) { setError(result.error); return; }
    router.push('/');
  }

  const stepIndex = STEPS.indexOf(currentStep);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const INTEREST_OPTIONS = [
    'Vintage', 'Streetwear', 'Designer', 'Minimalist', 'Sportswear',
    'Bohemian', 'Casual', 'Luxury', 'Sustainable', 'Y2K',
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">
              {t('step', { current: stepIndex + 1, total: STEPS.length })}
            </span>
            <span className="text-xs text-gray-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 p-3.5 flex items-start gap-2">
            <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── Step 1: Profile ──────────────────────────────────── */}
        {currentStep === 'profile' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 mb-4">
                <UserIcon className="h-7 w-7 text-violet-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('profileTitle')}</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">{t('profileSubtitle')}</p>
            </div>

            {/* Avatar */}
            <div className="flex justify-center mb-8">
              <label className="relative cursor-pointer group">
                <div className="h-24 w-24 rounded-full overflow-hidden border-3 border-gray-200 group-hover:border-violet-400 transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-violet-50 flex items-center justify-center">
                      <UserIcon className="h-10 w-10 text-violet-300" />
                    </div>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-violet-500 border-2 border-white flex items-center justify-center text-white group-hover:bg-violet-600 transition">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarSelect} className="hidden" />
              </label>
            </div>
            <p className="text-center text-xs text-gray-400 -mt-4 mb-6">{t('avatarHint')}</p>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('username')} *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  className={`w-full rounded-xl border pl-8 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                    usernameStatus === 'available' ? 'border-green-300 focus:border-green-400 focus:ring-green-500/10' :
                    usernameStatus === 'taken' ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10' :
                    'border-gray-200 focus:border-violet-500 focus:ring-violet-500/10'
                  }`}
                  placeholder="yourname"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />}
                  {usernameStatus === 'available' && <Check className="h-4 w-4 text-green-500" />}
                  {usernameStatus === 'taken' && <X className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-400">{t('usernameHint')}</p>
              {usernameStatus === 'taken' && (
                <p className="mt-1 text-xs text-red-500">{t('usernameTaken')}</p>
              )}
            </div>

            {/* Display name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                placeholder={t('displayNamePlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-400">{t('displayNameHint')}</p>
            </div>

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('bio')}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all resize-none"
                placeholder={t('bioPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{bio.length}/500</p>
            </div>

            <button
              onClick={handleProfileSubmit}
              disabled={saving || username.length < 3 || usernameStatus === 'taken'}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? t('saving') : t('continue')}
              {!saving && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        )}

        {/* ── Step 2: Location ─────────────────────────────────── */}
        {currentStep === 'location' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 mb-4">
                <MapPin className="h-7 w-7 text-violet-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('locationTitle')}</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">{t('locationSubtitle')}</p>
            </div>

            {/* Country */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('country')} *</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none bg-white transition-all"
              >
                {[
                  ['RO', 'Romania'], ['GB', 'United Kingdom'], ['FR', 'France'],
                  ['DE', 'Germany'], ['IT', 'Italy'], ['ES', 'Spain'],
                  ['NL', 'Netherlands'], ['BE', 'Belgium'], ['PL', 'Poland'],
                  ['PT', 'Portugal'], ['SE', 'Sweden'], ['AT', 'Austria'],
                  ['HU', 'Hungary'], ['BG', 'Bulgaria'], ['CZ', 'Czech Republic'],
                ].map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">{t('countryHint')}</p>
            </div>

            {/* City */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('city')}</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                placeholder={t('cityPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-400">{t('cityHint')}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('profile')}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </button>
              <button
                onClick={handleLocationSubmit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? t('saving') : t('continue')}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

            <button
              onClick={() => { setCurrentStep('preferences'); }}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            >
              {t('skipStep')}
            </button>
          </div>
        )}

        {/* ── Step 3: Preferences ──────────────────────────────── */}
        {currentStep === 'preferences' && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 mb-4">
                <Sparkles className="h-7 w-7 text-violet-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{t('preferencesTitle')}</h1>
              <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">{t('preferencesSubtitle')}</p>
            </div>

            {/* Intent */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('intentLabel')}</label>
              <div className="grid grid-cols-3 gap-3">
                {(['buy', 'sell', 'both'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setIntent(option)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      intent === option
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold">{t(`intent_${option}`)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style interests */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('interestsLabel')}</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setInterests((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm border transition-all ${
                      interests.includes(tag)
                        ? 'border-violet-500 bg-violet-50 text-violet-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {interests.includes(tag) && <Check className="h-3 w-3" />}
                    {tag}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-400">{t('interestsHint')}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('location')}
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back')}
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? t('saving') : t('finish')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
