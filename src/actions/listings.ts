'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createListing(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const brand = formData.get('brand') as string;
  const size = formData.get('size') as string;
  const condition = formData.get('condition') as string;
  const category = formData.get('category') as string;
  const subcategory = formData.get('subcategory') as string;
  const price = Math.round(parseFloat(formData.get('price') as string) * 100);
  const images = JSON.parse(formData.get('images') as string || '[]') as string[];

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title,
      description,
      brand: brand || null,
      size,
      condition,
      category,
      subcategory: subcategory || null,
      price,
      images,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/browse');
  return { success: true, listing: data };
}

export async function updateListing(id: string, formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const updates: Record<string, unknown> = {};
  const fields = ['title', 'description', 'brand', 'size', 'condition', 'category', 'subcategory'];
  for (const field of fields) {
    const val = formData.get(field);
    if (val !== null) updates[field] = val || null;
  }
  const priceStr = formData.get('price') as string;
  if (priceStr) updates.price = Math.round(parseFloat(priceStr) * 100);
  const imagesStr = formData.get('images') as string;
  if (imagesStr) updates.images = JSON.parse(imagesStr);

  const { error } = await supabase
    .from('listings')
    .update(updates)
    .eq('id', id)
    .eq('seller_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/item/${id}`);
  revalidatePath('/browse');
  return { success: true };
}

export async function deleteListing(id: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('listings')
    .update({ status: 'removed' })
    .eq('id', id)
    .eq('seller_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/browse');
  return { success: true };
}

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

    try { await supabase.rpc('decrement_favorites', { listing_id: listingId }); } catch { /* optional rpc */ }
    return { favorited: false };
  } else {
    await supabase
      .from('favorites')
      .insert({ user_id: user.id, listing_id: listingId });

    try { await supabase.rpc('increment_favorites', { listing_id: listingId }); } catch { /* optional rpc */ }
    return { favorited: true };
  }
}
