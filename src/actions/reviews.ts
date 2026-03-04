'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createReview(
  orderId: string,
  reviewedId: string,
  rating: number,
  comment: string,
  reviewType: 'buyer_to_seller' | 'seller_to_buyer'
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('reviews').insert({
    order_id: orderId,
    reviewer_id: user.id,
    reviewed_id: reviewedId,
    rating,
    comment: comment || null,
    review_type: reviewType,
  });

  if (error) return { error: error.message };

  revalidatePath(`/profile/${reviewedId}`);
  return { success: true };
}
