'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleFavorite(listingId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: existing } = await supabase
    .from('favorites')
    .select()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .single();

  if (existing) {
    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('listing_id', listingId);
    revalidatePath('/browse');
    return { favorited: false };
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: user.id, listing_id: listingId });
    revalidatePath('/browse');
    return { favorited: true };
  }
}
