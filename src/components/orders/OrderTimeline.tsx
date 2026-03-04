import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'paid', label: 'Paid' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_ORDER: Record<string, number> = {
  pending: -1,
  paid: 0,
  shipped: 1,
  delivered: 2,
  completed: 3,
  disputed: 2,
  refunded: -1,
  cancelled: -1,
};

interface OrderTimelineProps {
  status: string;
}

export function OrderTimeline({ status }: OrderTimelineProps) {
  const currentStep = STATUS_ORDER[status] ?? -1;

  if (status === 'disputed') {
    return (
      <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg">
        <Circle className="w-4 h-4 fill-yellow-600" />
        <span className="font-medium">Dispute in progress</span>
      </div>
    );
  }

  if (status === 'refunded' || status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
        <Circle className="w-4 h-4 fill-red-600" />
        <span className="font-medium">{status === 'refunded' ? 'Refunded' : 'Cancelled'}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, idx) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2',
                idx <= currentStep
                  ? 'bg-green-600 border-green-600 text-white'
                  : 'border-gray-300 text-gray-300'
              )}
            >
              {idx <= currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs">{idx + 1}</span>
              )}
            </div>
            <span
              className={cn(
                'text-xs mt-1',
                idx <= currentStep ? 'text-green-600 font-medium' : 'text-gray-400'
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-2',
                idx < currentStep ? 'bg-green-600' : 'bg-gray-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
