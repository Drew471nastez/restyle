'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Trash2 } from 'lucide-react';

interface AdminListingActionsProps {
  listingId: string;
  status: string;
  isFeatured: boolean;
}

export function AdminListingActions({
  listingId,
  status,
  isFeatured,
}: AdminListingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: 'feature' | 'remove') => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/${action}`, {
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
      {status === 'active' && (
        <>
          <Button
            onClick={() => handleAction('feature')}
            disabled={loading !== null}
            variant="outline"
            size="sm"
          >
            {loading === 'feature' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Star
                  className={`w-3 h-3 mr-1 ${
                    isFeatured ? 'fill-yellow-400 text-yellow-400' : ''
                  }`}
                />
                {isFeatured ? 'Unfeature' : 'Feature'}
              </>
            )}
          </Button>
          <Button
            onClick={() => handleAction('remove')}
            disabled={loading !== null}
            variant="destructive"
            size="sm"
          >
            {loading === 'remove' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );
}
