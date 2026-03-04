import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Clock, TrendingUp } from 'lucide-react';
import { PayoutForm } from './PayoutForm';

function getTransactionBadgeVariant(type: string) {
  switch (type) {
    case 'sale':
      return 'default' as const;
    case 'payout':
      return 'secondary' as const;
    case 'refund':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
}

export default async function WalletPage() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
    return null;
  }

  // Fetch wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch transactions
  const { data: transactions } = wallet
    ? await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] };

  const available = wallet?.available_balance || 0;
  const pending = wallet?.pending_balance || 0;
  const totalEarned = wallet?.total_earned || 0;
  const currency = wallet?.currency || 'EUR';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Available</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(available / 100).toFixed(2)} {currency}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(pending / 100).toFixed(2)} {currency}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(totalEarned / 100).toFixed(2)} {currency}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutForm
            availableBalance={available}
            currency={currency}
            currentIban={wallet?.iban || ''}
          />
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-gray-500">Date</th>
                    <th className="pb-3 font-medium text-gray-500">Type</th>
                    <th className="pb-3 font-medium text-gray-500">
                      Description
                    </th>
                    <th className="pb-3 font-medium text-gray-500">Status</th>
                    <th className="pb-3 font-medium text-gray-500 text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 text-gray-600">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <Badge variant={getTransactionBadgeVariant(tx.type)}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-600">
                        {tx.description || '-'}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{tx.status}</Badge>
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          tx.type === 'payout' || tx.type === 'refund'
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {tx.type === 'payout' || tx.type === 'refund'
                          ? '-'
                          : '+'}
                        {(tx.amount / 100).toFixed(2)} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
