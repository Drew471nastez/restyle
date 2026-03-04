import { Card, CardContent } from '@/components/ui/card';
import { cn, formatPrice } from '@/lib/utils';

interface BalanceCardProps {
  label: string;
  amount: number;
  currency?: string;
  variant?: 'default' | 'primary' | 'muted';
}

export function BalanceCard({ label, amount, currency = 'RON', variant = 'default' }: BalanceCardProps) {
  return (
    <Card className={cn(
      variant === 'primary' && 'bg-green-50 border-green-200',
      variant === 'muted' && 'bg-gray-50'
    )}>
      <CardContent className="p-6">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className={cn(
          'text-2xl font-bold',
          variant === 'primary' ? 'text-green-700' : 'text-gray-900'
        )}>
          {formatPrice(amount, currency)}
        </p>
      </CardContent>
    </Card>
  );
}
