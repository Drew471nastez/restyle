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
      // Check if user has a profile set up
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user.id)
        .single();

      // If no profile or username starts with default prefix, redirect to onboarding
      if (!profile || !profile.username || profile.username.startsWith('user_')) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
