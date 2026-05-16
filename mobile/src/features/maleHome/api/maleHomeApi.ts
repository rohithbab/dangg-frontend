/**
 * Browse-females API for the Male Home screen.
 *
 * Returns empty results until the backend is wired. The UI's empty-state
 * card ("No one available right now") is what renders in that case.
 */
import { Env } from '@core/config/env';
import { mapSupabaseError } from '@core/network/apiErrorMapper';
import { getSupabaseClient } from '@core/network/supabaseClient';

import { type FemaleFilters } from '../store/femaleFiltersStore';

export type AvailableFemale = {
  id: string;
  name: string;
  age: number;
  rating: number;
  totalChats: number;
  /** Public-facing avatar URL — Cloudinary in production. */
  imageUrl: string;
  isOnline: boolean;
  isNew: boolean;
  isVerified: boolean;
  coinPrice: number;
  averageResponseMinutes: number;
  bio: string;
  isFavorited: boolean;
};

/** Paginated browse list, applying the current Zustand filter snapshot. */
export async function browseFemales(
  filters: FemaleFilters,
  pageSize = 20,
  offset = 0,
): Promise<{ items: ReadonlyArray<AvailableFemale>; hasMore: boolean; totalOnline: number }> {
  if (Env.devMode) {
    return { items: [], hasMore: false, totalOnline: 0 };
  }
  const { data, error } = await getSupabaseClient().rpc('browse_females', {
    p_filters: filters,
    p_offset: offset,
    p_limit: pageSize,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  return data as Awaited<ReturnType<typeof browseFemales>>;
}

/** Returns the male's favorited females for the horizontal carousel on Home. */
export async function listFavorites(): Promise<ReadonlyArray<AvailableFemale>> {
  if (Env.devMode) {
    return [];
  }
  const { data, error } = await getSupabaseClient().rpc('male_favorites');
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as AvailableFemale[];
}

/** Toggle a female in/out of the male's favorites. Optimistic by caller. */
export async function toggleFavorite(femaleId: string): Promise<boolean> {
  if (Env.devMode) {
    return false;
  }
  const { data, error } = await getSupabaseClient().rpc('toggle_favorite', {
    p_female_id: femaleId,
  });
  if (error) {
    throw mapSupabaseError(error);
  }
  return Boolean((data as { favorited?: boolean } | null)?.favorited);
}

/** Fetches a single female profile by id (for Female Profile Preview screen). */
export async function getFemaleById(femaleId: string): Promise<AvailableFemale | null> {
  if (Env.devMode) {
    return null;
  }
  const { data, error } = await getSupabaseClient()
    .from('females')
    .select('*')
    .eq('id', femaleId)
    .maybeSingle();
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data as AvailableFemale | null) ?? null;
}
