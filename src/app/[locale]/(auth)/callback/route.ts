import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || searchParams.get('redirect') || '/';

  if (code) {
    const supabase = await createServerClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step, status')
        .eq('id', data.user.id)
        .maybeSingle();

      // New user or incomplete onboarding → redirect to onboarding
      if (!profile || profile.onboarding_step !== 'complete') {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Reactivate if returning from deactivation
      if (profile.status === 'deactivated') {
        await supabase
          .from('profiles')
          .update({ status: 'active' })
          .eq('id', data.user.id);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
