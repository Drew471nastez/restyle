import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { OnboardButton } from './OnboardButton';

export default async function SellerOnboardPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_onboarding_complete')
    .eq('id', user.id)
    .single();

  const isOnboarded = profile?.stripe_onboarding_complete === true;
  const hasStarted = !!profile?.stripe_account_id;

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Seller Onboarding
      </h1>

      {isOnboarded ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              You&apos;re all set!
            </h2>
            <p className="text-gray-500 mb-4">
              Your Stripe account is connected and verified. You can now receive
              payments from your sales.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p>
                Stripe Account ID:{' '}
                <span className="font-mono text-xs">
                  {profile?.stripe_account_id}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Connect Your Stripe Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To start selling on ReStyle, you need to connect a Stripe
                account. This allows us to securely process payments and send
                your earnings directly to your bank account.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 text-sm">
                  What you&apos;ll need:
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">&#10003;</span>
                    Government-issued ID for verification
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">&#10003;</span>
                    Bank account details (IBAN)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">&#10003;</span>
                    Personal information (address, date of birth)
                  </li>
                </ul>
              </div>

              {hasStarted && !isOnboarded && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    It looks like you started onboarding but didn&apos;t finish.
                    Click below to continue.
                  </p>
                </div>
              )}

              <OnboardButton hasStarted={hasStarted} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
