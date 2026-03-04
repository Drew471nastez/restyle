'use server';

import { createServerClient } from '@/lib/supabase/server';


export async function toggleFollow(targetUserId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  if (user.id === targetUserId) return { error: 'Cannot follow yourself' };

  const { data: existing } = await supabase
    .from('follows')
    .select()
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .single();

  if (existing) {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);
    return { following: false };
  } else {
    await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: targetUserId });
    return { following: true };
  }
}
