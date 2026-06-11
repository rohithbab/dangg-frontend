/**
 * Browse-females API for the Male Home screen.
 *
 * Returns empty results until the backend is wired. The UI's empty-state
 * card ("No one available right now") is what renders in that case.
 */
import { USE_MOCK_DATA } from '@core/config/env';
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

const MOCK_FEMALES: AvailableFemale[] = [
  {
    id: 'female-1',
    name: 'Aanya',
    age: 22,
    rating: 4.9,
    totalChats: 120,
    imageUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: false,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 2,
    bio: "Hey, I'm Aanya. Let's talk about books, movies, and anything you want! I love sharing travel stories.",
    isFavorited: false,
  },
  {
    id: 'female-2',
    name: 'Priya',
    age: 24,
    rating: 4.8,
    totalChats: 95,
    imageUrl:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: true,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 4,
    bio: 'Music is my life. Tell me your favorite song! Outgoing, friendly, and always up for late night vibes.',
    isFavorited: false,
  },
  {
    id: 'female-3',
    name: 'Riya',
    age: 21,
    rating: 4.7,
    totalChats: 140,
    imageUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: false,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 1,
    bio: "Always up for a good laugh and friendly conversations. Let's keep it light and fun!",
    isFavorited: false,
  },
  {
    id: 'female-4',
    name: 'Ananya',
    age: 23,
    rating: 4.6,
    totalChats: 60,
    imageUrl:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    isOnline: false,
    isNew: true,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 5,
    bio: "Friendly and talkative. Let's get to know each other! I love pets and coffee.",
    isFavorited: false,
  },
  {
    id: 'female-5',
    name: 'Diya',
    age: 20,
    rating: 4.9,
    totalChats: 80,
    imageUrl:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: false,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 2,
    bio: "Love traveling and nature. Let's talk about our dream destinations!",
    isFavorited: false,
  },
  {
    id: 'female-6',
    name: 'Sneha',
    age: 25,
    rating: 4.5,
    totalChats: 200,
    imageUrl:
      'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: false,
    isVerified: false,
    coinPrice: 15,
    averageResponseMinutes: 3,
    bio: 'Outgoing and energetic. I respond instantly and love deep talks about philosophy.',
    isFavorited: false,
  },
  {
    id: 'female-7',
    name: 'Kiara',
    age: 22,
    rating: 4.8,
    totalChats: 35,
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    isOnline: false,
    isNew: true,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 8,
    bio: 'Into fitness and healthy lifestyles. Hit me up if you want some motivation or just a good chat!',
    isFavorited: false,
  },
  {
    id: 'female-8',
    name: 'Ishita',
    age: 24,
    rating: 4.4,
    totalChats: 150,
    imageUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: false,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 6,
    bio: "Let's keep it simple and sweet. I enjoy talking about gaming and tech.",
    isFavorited: false,
  },
  {
    id: 'female-9',
    name: 'Tanvi',
    age: 23,
    rating: 4.7,
    totalChats: 110,
    imageUrl:
      'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&auto=format&fit=crop&q=80',
    isOnline: true,
    isNew: false,
    isVerified: true,
    coinPrice: 15,
    averageResponseMinutes: 2,
    bio: 'Creative mind and free spirit. Artist, dancer, and coffee lover.',
    isFavorited: false,
  },
];

const devFavorites = new Set<string>(['female-1', 'female-3']);

/** Paginated browse list, applying the current Zustand filter snapshot. */
export async function browseFemales(
  filters: FemaleFilters,
  pageSize = 20,
  offset = 0,
): Promise<{ items: ReadonlyArray<AvailableFemale>; hasMore: boolean; totalOnline: number }> {
  if (USE_MOCK_DATA) {
    let filtered = MOCK_FEMALES.map(f => ({
      ...f,
      isFavorited: devFavorites.has(f.id),
    }));

    // Filter by quick filter
    if (filters.quick === 'online') {
      filtered = filtered.filter(f => f.isOnline);
    } else if (filters.quick === 'new') {
      filtered = filtered.filter(f => f.isNew);
    } else if (filters.quick === 'topRated') {
      filtered = filtered.filter(f => f.rating >= 4.7);
    } else if (filters.quick === 'favorites') {
      filtered = filtered.filter(f => devFavorites.has(f.id));
    }

    // Filter by onlineOnly
    if (filters.onlineOnly) {
      filtered = filtered.filter(f => f.isOnline);
    }

    // Filter by age
    filtered = filtered.filter(f => f.age >= filters.ageMin && f.age <= filters.ageMax);

    // Filter by rating
    if (filters.rating === '3plus') {
      filtered = filtered.filter(f => f.rating >= 3.0);
    } else if (filters.rating === '4plus') {
      filtered = filtered.filter(f => f.rating >= 4.0);
    } else if (filters.rating === '4_5plus') {
      filtered = filtered.filter(f => f.rating >= 4.5);
    }

    // Filter by price
    if (filters.price === 'le50') {
      filtered = filtered.filter(f => f.coinPrice <= 50);
    } else if (filters.price === '51to100') {
      filtered = filtered.filter(f => f.coinPrice > 50 && f.coinPrice <= 100);
    } else if (filters.price === '100plus') {
      filtered = filtered.filter(f => f.coinPrice > 100);
    }

    // Sort
    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'price') {
      filtered.sort((a, b) => a.coinPrice - b.coinPrice);
    } else if (filters.sortBy === 'active') {
      filtered.sort((a, b) => b.totalChats - a.totalChats);
    }

    const totalOnline = filtered.filter(f => f.isOnline).length;
    const paginated = filtered.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < filtered.length;

    return {
      items: paginated,
      hasMore,
      totalOnline,
    };
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
  if (USE_MOCK_DATA) {
    return MOCK_FEMALES.filter(f => devFavorites.has(f.id)).map(f => ({
      ...f,
      isFavorited: true,
    }));
  }
  const { data, error } = await getSupabaseClient().rpc('male_favorites');
  if (error) {
    throw mapSupabaseError(error);
  }
  return (data ?? []) as AvailableFemale[];
}

/** Toggle a female in/out of the male's favorites. Optimistic by caller. */
export async function toggleFavorite(femaleId: string): Promise<boolean> {
  if (USE_MOCK_DATA) {
    if (devFavorites.has(femaleId)) {
      devFavorites.delete(femaleId);
      return false;
    } else {
      devFavorites.add(femaleId);
      return true;
    }
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
  if (USE_MOCK_DATA) {
    const found = MOCK_FEMALES.find(f => f.id === femaleId);
    if (found) {
      return {
        ...found,
        isFavorited: devFavorites.has(found.id),
      };
    }
    return null;
  }
  const client = getSupabaseClient();
  const { data: femaleData, error: femaleError } = await client
    .from('females_available_view')
    .select('*')
    .eq('female_id', femaleId)
    .maybeSingle();

  if (femaleError) {
    throw mapSupabaseError(femaleError);
  }
  if (!femaleData) {
    return null;
  }

  // Fetch if the male has favorited this female
  const { data: favoriteData, error: favoriteError } = await client
    .from('favorites')
    .select('id')
    .eq('female_id', femaleId)
    .maybeSingle();

  const isFavorited = !favoriteError && !!favoriteData;

  const mapped: AvailableFemale = {
    id: femaleData.female_id,
    name: femaleData.name,
    age: femaleData.age,
    rating: Number(femaleData.rating_avg),
    totalChats: femaleData.total_chats,
    imageUrl: femaleData.profile_picture_url || '',
    isOnline: femaleData.is_online,
    isNew: false,
    isVerified: true,
    coinPrice: femaleData.coin_price,
    averageResponseMinutes: femaleData.average_response_minutes,
    bio: femaleData.bio || '',
    isFavorited,
  };

  return mapped;
}

/**
 * Returns the subset of the given female ids that are STILL browseable
 * (verified + active + online), per `females_available_view`.
 *
 * Used by the Male Home grid to reconcile away cards whose "went offline"
 * realtime event was missed — the local Realtime pipeline drops
 * postgres_changes, so a force-closed female (swept offline by the backend
 * cron) would otherwise linger on the grid forever.
 */
export async function fetchOnlineFemaleIds(ids: ReadonlyArray<string>): Promise<Set<string>> {
  if (ids.length === 0) {
    return new Set();
  }
  const { data, error } = await getSupabaseClient()
    .from('females_available_view')
    .select('female_id')
    .in('female_id', ids as string[])
    .eq('is_online', true);
  if (error) {
    throw mapSupabaseError(error);
  }
  return new Set((data ?? []).map(r => (r as { female_id: string }).female_id));
}
