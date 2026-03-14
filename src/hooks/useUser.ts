'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface UseUserReturn {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (userId: string) => {
    // Try to get existing profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      setProfile(existingProfile);
      return;
    }

    // Profile doesn't exist yet - create it from auth user metadata
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const username = authUser.user_metadata?.username
      || authUser.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '')
      || `user_${userId.slice(0, 8)}`;

    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username,
        display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
        status: 'onboarding',
        onboarding_step: 'profile',
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (newProfile) {
      setProfile(newProfile);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    let cancelled = false;

    async function getUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (cancelled) return;

        setUser(authUser);
        if (authUser) {
          await fetchProfile(authUser.id);
        }
      } catch {
        // auth error - user not logged in
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  return { user, profile, loading, refreshProfile };
}
