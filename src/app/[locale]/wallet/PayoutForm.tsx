'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PayoutFormProps {
  availableBalance: number;
  currency: string;
  currentIban: string;
}

export function PayoutForm({
  availableBalance,
  currency,
  currentIban,
}: PayoutFormProps) {
  const router = useRouter();
  const [iban, setIban] = useState(currentIban);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }
    if (amountCents > availableBalance) {
      setMessage('Insufficient balance');
      return;
    }
    if (!iban.trim()) {
      setMessage('Please enter your IBAN');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountCents, iban: iban.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Something went wrong');
      } else {
        setMessage('Payout request submitted successfully!');
        setAmount('');
        router.refresh();
      }
    } catch {
      setMessage('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="iban"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          IBAN
        </label>
        <input
          id="iban"
          type="text"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="DE89 3704 0044 0532 0130 00"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent font-mono"
        />
      </div>

      <div>
        <label
          htmlFor="amount"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Amount ({currency})
        </label>
        <input
          id="amount"
          type="number"
          step="0.01"
          min="0.01"
          max={(availableBalance / 100).toFixed(2)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          Available: {(availableBalance / 100).toFixed(2)} {currency}
        </p>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.includes('success') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}

      <Button type="submit" disabled={loading || availableBalance <= 0}>
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Request Payout'
        )}
      </Button>
    </form>
  );
}
