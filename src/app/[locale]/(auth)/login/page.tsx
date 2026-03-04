'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const t = useTranslations('auth');
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Please try again.'
            : authError.message
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = redirect;
      }, 800);
    } catch {
      setError(t('unexpectedError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/callback?next=${encodeURIComponent(redirect)}`,
        },
      });
    } catch {
      setError(t('unexpectedError'));
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel - desktop only */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-violet-600 via-violet-500 to-purple-400 items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />
        </div>
        <div className="relative z-10 text-center px-12 max-w-sm">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Welcome back to ReStyle</h2>
          <p className="text-violet-100 text-base leading-relaxed">
            Your pre-loved fashion marketplace. Sustainable style, great prices.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['1M+', 'Members'], ['500K+', 'Listings'], ['4.8★', 'Rating']].map(([val, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white">{val}</p>
                <p className="text-xs text-violet-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 bg-violet-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ReStyle</span>
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t('loginTitle')}</h1>
            <p className="mt-2 text-gray-500 text-sm">{t('loginSubtitle')}</p>
          </div>

          {/* Success state */}
          {success && (
            <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 className="h-5 w-5 text-purple-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Login successful!</p>
                <p className="text-xs text-purple-600">Redirecting you now…</p>
              </div>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
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
          <div className="relative my-6">
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('password')}
                </label>
                <Link href="/forgot-password" className="text-xs text-violet-500 hover:text-violet-600 transition-colors">
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 outline-none transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : success ? 'Redirecting…' : t('login')}
            </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {t('noAccount')}{' '}
            <Link href="/signup" className="font-semibold text-violet-500 hover:text-violet-600 transition-colors">
              {t('signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
