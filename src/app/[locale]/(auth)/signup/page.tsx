'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, CheckCircle2, Mail } from 'lucide-react';

export default function SignupPage() {
  const t = useTranslations('auth');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers and underscores.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: `${window.location.origin}/callback?next=/onboarding`,
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Try logging in instead.');
        } else {
          setError(authError.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback?next=/`,
        },
      });
    } catch {
      setError(t('unexpectedError'));
    }
  }

  // Email confirmation sent screen
  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-50 mb-6">
            <Mail className="h-10 w-10 text-violet-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            We sent a confirmation link to
          </p>
          <p className="text-gray-900 font-semibold text-sm mb-6">{email}</p>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Click the link in the email to activate your account and start shopping on ReStyle.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-left mb-8">
            <p className="text-xs font-semibold text-amber-800 mb-1">Didn&apos;t receive the email?</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure you typed the email correctly</li>
              <li>Allow a few minutes for delivery</li>
            </ul>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-11 px-8 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-violet-600 via-violet-500 to-purple-400 items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-16 right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-16 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>
        <div className="relative z-10 text-center px-12 max-w-sm">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Join ReStyle today</h2>
          <p className="text-violet-100 text-base leading-relaxed mb-10">
            Buy and sell pre-loved fashion. Sustainable style starts here.
          </p>
          <div className="space-y-3">
            {[
              ['✓', 'Free to list your items'],
              ['✓', 'Secure buyer protection'],
              ['✓', 'Fast payouts to your bank'],
              ['✓', 'Millions of buyers waiting'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-center gap-3 text-sm text-violet-100">
                <span className="font-bold text-white">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-violet-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ReStyle</span>
            </Link>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('signupTitle')}</h1>
            <p className="mt-2 text-gray-500 text-sm">{t('signupSubtitle')}</p>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t('continueWithGoogle')}
          </button>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-gray-400 tracking-widest">{t('or')}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3.5">
                <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('username')}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">@</span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  minLength={3}
                  maxLength={30}
                  className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                  placeholder="yourname"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">Letters, numbers, underscores only</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength */}
              {password.length > 0 && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? password.length < 8 ? 'bg-amber-400' : 'bg-purple-400'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 outline-none transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-500/10'
                      : 'border-gray-200 focus:border-violet-500 focus:ring-violet-500/10'
                  }`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-9 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              By signing up, you agree to our{' '}
              <Link href="/terms" className="text-violet-500 hover:text-violet-600">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-violet-500 hover:text-violet-600">Privacy Policy</Link>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Creating account…' : t('createAccount')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('haveAccount')}{' '}
            <Link href="/login" className="font-semibold text-violet-500 hover:text-violet-600 transition-colors">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
