import { ShieldCheck } from 'lucide-react';

interface VerificationBadgeProps {
  className?: string;
}

export function VerificationBadge({ className }: VerificationBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 text-green-600 ${className || ''}`}>
      <ShieldCheck className="w-4 h-4" />
      <span className="text-xs font-medium">Verified</span>
    </span>
  );
}
