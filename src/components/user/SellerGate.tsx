'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { checkSellerEligibility, acceptSellerTerms } from '@/actions/user';
import { AlertTriangle, CheckCircle2, ArrowRight, Loader2, Shield } from 'lucide-react';
import type { SellerEligibility } from '@/types/database';

const REQUIREMENT_LABELS: Record<string, { label: string; desc: string; link: string }> = {
  username: {
    label: 'Set your username',
    desc: 'Choose a unique username for your profile',
    link: '/onboarding',
  },
  email_verification: {
    label: 'Verify your email',
    desc: 'Check your inbox for the verification email',
    link: '/settings',
  },
  country: {
    label: 'Set your country',
    desc: 'We need your location for shipping and compliance',
    link: '/settings',
  },
  seller_terms: {
    label: 'Accept seller terms',
    desc: 'Review and accept the marketplace seller agreement',
    link: '#accept-terms',
  },
  onboarding: {
    label: 'Complete onboarding',
    desc: 'Finish setting up your profile to start selling',
    link: '/onboarding',
  },
};

interface SellerGateProps {
  children: React.ReactNode;
}

export function SellerGate({ children }: SellerGateProps) {
  const [eligibility, setEligibility] = useState<SellerEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptingTerms, setAcceptingTerms] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const result = await checkSellerEligibility();
        setEligibility(result);
      } catch {
        setEligibility({ canSell: false, missing: ['Profile not found'] });
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (eligibility?.canSell) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 mb-4">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Complete your profile to sell</h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Before you can list items on ReStyle, we need a few things from you. This helps keep our marketplace safe and trustworthy.
        </p>
      </div>

      <div className="space-y-3">
        {eligibility?.missing.map((key) => {
          const req = REQUIREMENT_LABELS[key];
          if (!req) return (
            <div key={key} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
              <p className="text-sm text-gray-700">{key}</p>
            </div>
          );

          if (key === 'seller_terms') {
            return (
              <div key={key} className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-violet-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{req.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{req.desc}</p>
                    <button
                      onClick={async () => {
                        setAcceptingTerms(true);
                        await acceptSellerTerms();
                        const result = await checkSellerEligibility();
                        setEligibility(result);
                        setAcceptingTerms(false);
                      }}
                      disabled={acceptingTerms}
                      className="mt-3 flex items-center gap-2 h-9 px-4 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 disabled:opacity-60 transition"
                    >
                      {acceptingTerms ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      I accept the seller terms
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={key}
              href={req.link}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-violet-200 hover:bg-violet-50/50 transition group"
            >
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{req.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{req.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
