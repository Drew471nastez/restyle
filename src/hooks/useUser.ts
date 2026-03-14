'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();

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
      || authUser.email?.split('@')[0]
      || `user_${userId.slice(0, 8)}`;

    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username,
        display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || username,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (newProfile) {
      setProfile(newProfile);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          await fetchProfile(user.id);
        }
      } catch {
        // auth error - user not logged in
      } finally {
        setLoading(false);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { user, profile, loading };
}
