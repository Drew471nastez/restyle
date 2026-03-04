'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, RotateCcw } from 'lucide-react';

interface DisputeActionsProps {
  orderId: string;
}

export function DisputeActions({ orderId }: DisputeActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleResolve = async (resolution: 'refund-buyer' | 'release-seller') => {
    setLoading(resolution);
    try {
      const res = await fetch(`/api/admin/disputes/${orderId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Something went wrong');
      } else {
        router.refresh();
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleResolve('refund-buyer')}
        disabled={loading !== null}
        variant="destructive"
        size="sm"
      >
        {loading === 'refund-buyer' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <RotateCcw className="w-3 h-3 mr-1" />
            Refund Buyer
          </>
        )}
      </Button>
      <Button
        onClick={() => handleResolve('release-seller')}
        disabled={loading !== null}
        variant="outline"
        size="sm"
      >
        {loading === 'release-seller' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Release to Seller
          </>
        )}
      </Button>
    </div>
  );
}
