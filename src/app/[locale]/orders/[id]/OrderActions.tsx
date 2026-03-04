'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Truck, PackageCheck, AlertTriangle, type LucideIcon } from 'lucide-react';

interface OrderActionsProps {
  orderId: string;
  status: string;
  isBuyer: boolean;
}

export function OrderActions({ orderId, status, isBuyer }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/orders/${orderId}/${action}`, {
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

  // Determine which actions to show
  const actions: Array<{
    action: string;
    label: string;
    icon: LucideIcon;
    variant: 'default' | 'outline' | 'destructive';
  }> = [];

  if (!isBuyer && status === 'paid') {
    actions.push({
      action: 'confirm-shipment',
      label: 'Confirm Shipment',
      icon: Truck,
      variant: 'default',
    });
  }

  if (isBuyer && status === 'delivered') {
    actions.push({
      action: 'confirm-delivery',
      label: 'Confirm Delivery',
      icon: PackageCheck,
      variant: 'default',
    });
  }

  if (
    isBuyer &&
    ['shipped', 'delivered'].includes(status)
  ) {
    actions.push({
      action: 'dispute',
      label: 'Open Dispute',
      icon: AlertTriangle,
      variant: 'destructive',
    });
  }

  if (actions.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {actions.map(({ action, label, icon: Icon, variant }) => (
            <Button
              key={action}
              onClick={() => handleAction(action)}
              disabled={loading !== null}
              variant={variant}
              className="flex-1"
            >
              {loading === action ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Icon className="w-4 h-4 mr-2" />
              )}
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
