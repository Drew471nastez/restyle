'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { User as UserIcon, Camera, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Form fields
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Pre-fill from auth metadata
      const meta = user.user_metadata || {};
      setUsername(meta.username || user.email?.split('@')[0] || '');
      setDisplayName(meta.full_name || meta.name || '');
      if (meta.avatar_url || meta.picture) {
        setAvatarPreview(meta.avatar_url || meta.picture);
      }

      // Check if profile already exists with a real username set
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single();

      if (existingProfile && existingProfile.username && !existingProfile.username.startsWith('user_')) {
        // Profile already configured, skip onboarding
        router.push('/');
        return;
      }

      setLoading(false);
    }
    checkUser();
  }, [router]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleComplete = async () => {
    if (!userId) return;
    if (!username || username.length < 3) {
      setError(t('usernameTooShort'));
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(t('usernameInvalid'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const supabase = createClient();

      // Check username availability
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .neq('id', userId)
        .single();

      if (existing) {
        setError(t('usernameTaken'));
        setSaving(false);
        return;
      }

      let avatarUrl = avatarPreview;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }

      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: username.toLowerCase(),
          display_name: displayName || username,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        }, { onConflict: 'id' });

      if (profileError) {
        if (profileError.message.includes('profiles_username_key')) {
          setError(t('usernameTaken'));
        } else {
          setError(profileError.message);
        }
        setSaving(false);
        return;
      }

      // Redirect to home
      router.push('/');
    } catch {
      setError(t('unexpectedError'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-violet-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('welcomeTitle')}</h1>
            <p className="text-sm text-gray-500 mb-8">{t('welcomeSubtitle')}</p>

            {/* Avatar */}
            <div className="flex justify-center mb-8">
              <label className="relative cursor-pointer group">
                <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-violet-400 transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-violet-50 flex items-center justify-center">
                      <UserIcon className="h-10 w-10 text-violet-300" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-violet-500 border-2 border-white flex items-center justify-center text-white group-hover:bg-violet-600 transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              </label>
            </div>

            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('username')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                  placeholder="yourname"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">{t('usernameHint')}</p>
            </div>

            {/* Display name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('displayName')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                placeholder={t('displayNamePlaceholder')}
              />
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (!username || username.length < 3) {
                  setError(t('usernameTooShort'));
                  return;
                }
                if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                  setError(t('usernameInvalid'));
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
            >
              {t('continue')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('bioTitle')}</h1>
            <p className="text-sm text-gray-500 mb-8">{t('bioSubtitle')}</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('bio')}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={300}
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all resize-none"
                placeholder={t('bioPlaceholder')}
              />
              <p className="mt-1 text-xs text-gray-400 text-right">{bio.length}/300</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('back')}
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {saving ? t('saving') : t('finish')}
              </button>
            </div>

            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('skip')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
