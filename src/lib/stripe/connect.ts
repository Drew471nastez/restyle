import { stripe } from './client';

export async function createConnectedAccount(
  userId: string,
  email: string,
  country: string = 'RO'
): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    country,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { platform_user_id: userId },
  });
  return account.id;
}

export async function createOnboardingLink(
  accountId: string,
  locale: string = 'en'
): Promise<string> {
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/seller/onboard?stripe=refresh`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/seller/onboard?stripe=complete`,
    type: 'account_onboarding',
  });
  return link.url;
}

export async function getAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  };
}
