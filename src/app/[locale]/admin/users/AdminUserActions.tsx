'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Ban } from 'lucide-react';

interface AdminUserActionsProps {
  userId: string;
  isVerified: boolean;
}

export function AdminUserActions({
  userId,
  isVerified,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'verify' | 'ban') => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
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
    <div className="flex gap-1 justify-end">
      {!isVerified && (
        <Button
          onClick={() => handleAction('verify')}
          disabled={loading !== null}
          variant="outline"
          size="sm"
        >
          {loading === 'verify' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-3 h-3 mr-1" />
              Verify
            </>
          )}
        </Button>
      )}
      <Button
        onClick={() => handleAction('ban')}
        disabled={loading !== null}
        variant="destructive"
        size="sm"
      >
        {loading === 'ban' ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <Ban className="w-3 h-3 mr-1" />
            Ban
          </>
        )}
      </Button>
    </div>
  );
}
