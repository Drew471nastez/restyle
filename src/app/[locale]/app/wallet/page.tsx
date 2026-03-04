import { getTranslations } from 'next-intl/server';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { MIN_PAYOUT_AMOUNT } from '@/lib/constants';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

const TX_TYPE_ICONS: Record<string, { icon: typeof ArrowUpRight; color: string }> = {
  sale: { icon: ArrowDownLeft, color: 'bg-green-100 text-green-600' },
  payout: { icon: ArrowUpRight, color: 'bg-blue-100 text-blue-600' },
  refund: { icon: ArrowDownLeft, color: 'bg-red-100 text-red-600' },
  fee: { icon: ArrowUpRight, color: 'bg-gray-100 text-gray-600' },
};

const TX_STATUS_STYLES: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
};

export default async function WalletPage() {
  const t = await getTranslations('wallet');
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
    return null;
  }

  let availableBalance = 0;
  let pendingBalance = 0;
  let totalEarned = 0;
  let currency = 'RON';
  let hasIBAN = false;
  let transactions: Transaction[] = [];

  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (wallet) {
      availableBalance = wallet.available_balance || 0;
      pendingBalance = wallet.pending_balance || 0;
      totalEarned = wallet.total_earned || 0;
      currency = wallet.currency || 'RON';
      hasIBAN = !!wallet.iban;
    }
  } catch {
    // silently fail
  }

  try {
    const { data: walletData } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (walletData) {
      const { data: txns } = await supabase
        .from('transactions')
        .select('id, type, amount, status, description, created_at')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(50);

      transactions = txns || [];
    }
  } catch {
    // silently fail
  }

  const canPayout = availableBalance >= MIN_PAYOUT_AMOUNT && hasIBAN;

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('subtitle')}</p>
      </div>

      {/* IBAN Alert */}
      {!hasIBAN && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {t('ibanRequired')}
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              {t('ibanDescription')}
            </p>
            <Link
              href="/app/profile"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800"
            >
              {t('setupIBAN')}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
              <Wallet className="h-5 w-5 text-violet-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {t('availableBalance')}
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {(availableBalance / 100).toFixed(2)}{' '}
            <span className="text-lg font-medium text-gray-400">
              {currency}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {t('pendingBalance')}
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {(pendingBalance / 100).toFixed(2)}{' '}
            <span className="text-lg font-medium text-gray-400">
              {currency}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {t('totalEarned')}
            </p>
          </div>
          <p className="mt-3 text-3xl font-bold text-gray-900">
            {(totalEarned / 100).toFixed(2)}{' '}
            <span className="text-lg font-medium text-gray-400">
              {currency}
            </span>
          </p>
        </div>
      </div>

      {/* Payout Button */}
      <div className="mb-8">
        <form
          action={async () => {
            'use server';
            const { requestPayout } = await import('@/actions/wallet');
            // This triggers the payout action - in a real app you'd have a modal with amount input
            await requestPayout(availableBalance / 100);
          }}
        >
          <button
            type="submit"
            disabled={!canPayout}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowUpRight className="h-4 w-4" />
            {t('requestPayout')}
          </button>
        </form>
        {!canPayout && availableBalance > 0 && !hasIBAN && (
          <p className="mt-2 text-xs text-gray-500">{t('setupIBANFirst')}</p>
        )}
        {!canPayout && availableBalance < MIN_PAYOUT_AMOUNT && (
          <p className="mt-2 text-xs text-gray-500">
            {t('minPayout', {
              amount: (MIN_PAYOUT_AMOUNT / 100).toFixed(2),
              currency,
            })}
          </p>
        )}
      </div>

      {/* Transaction History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {t('transactionHistory')}
        </h2>

        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <CreditCard className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900">
              {t('noTransactions')}
            </h3>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              {t('noTransactionsDescription')}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {transactions.map((tx, index) => {
              const txType = TX_TYPE_ICONS[tx.type] || TX_TYPE_ICONS.fee;
              const TxIcon = txType.icon;
              const isPositive = tx.amount > 0;

              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    index < transactions.length - 1
                      ? 'border-b border-gray-100'
                      : ''
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${txType.color}`}
                  >
                    <TxIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {tx.description || t(`txType.${tx.type}`)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-bold ${
                        isPositive ? 'text-green-600' : 'text-gray-900'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {(tx.amount / 100).toFixed(2)} {currency}
                    </p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        TX_STATUS_STYLES[tx.status] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t(`txStatus.${tx.status}`)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
