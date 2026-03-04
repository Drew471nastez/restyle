'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';

interface OnboardButtonProps {
  hasStarted: boolean;
}

export function OnboardButton({ hasStarted }: OnboardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleOnboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/connect-onboard', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
        setLoading(false);
      }
    } catch {
      alert('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleOnboard} disabled={loading} size="lg" className="w-full">
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirecting to Stripe...
        </>
      ) : (
        <>
          <ExternalLink className="w-4 h-4 mr-2" />
          {hasStarted ? 'Continue Onboarding' : 'Start Onboarding'}
        </>
      )}
    </Button>
  );
}
