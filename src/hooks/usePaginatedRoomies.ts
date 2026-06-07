import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoomieFilters {
  gender?: string;
  ageRange?: [number, number];
  nationalities?: string[];
  languages?: string[];
  hasProfileImage?: boolean;
}

export interface PaginatedRoomie {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  study: string | null;
  work: string | null;
  age: number | null;
  gender: string | null;
  nationality: string | null;
  bio: string | null;
  images: string[] | null;
  personality: string[] | null;
  lifestyle: string[] | null;
  languages: string[] | null;
  monthly_budget: number | null;
  rental_period: string | null;
  last_seen_at?: string | null;
  median_response_minutes?: number | null;
}

const PAGE_SIZE = 15;

export function usePaginatedRoomies(filters: RoomieFilters = {}) {
  const { user } = useAuth();
  const [roomies, setRoomies] = useState<PaginatedRoomie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());

  // Fetch blocked users once
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      if (!user) {
        setBlockedUserIds(new Set());
        return;
      }
      const { data } = await supabase
        .from('blocked_users')
        .select('blocked_user_id')
        .eq('user_id', user.id);
      setBlockedUserIds(new Set(data?.map(b => b.blocked_user_id).filter(Boolean) || []));
    };
    fetchBlockedUsers();
  }, [user]);

  const buildQuery = useCallback(() => {
    let query = supabase
      .from('profiles')
      .select('id, user_id, name, avatar_url, study, work, age, gender, nationality, bio, images, personality, lifestyle, languages, monthly_budget, rental_period, hidden_from_explore, last_seen_at, median_response_minutes')
      .eq('user_type', 'roomie')
      .eq('hidden_from_explore', false)
      .order('created_at', { ascending: false });

    // Apply gender filter at database level
    if (filters.gender && filters.gender !== 'all') {
      const genderMap: Record<string, string[]> = {
        'male': ['male', 'Mand'],
        'female': ['female', 'Kvinde'],
        'other': ['other', 'Andet']
      };
      const genderValues = genderMap[filters.gender];
      if (genderValues) {
        query = query.in('gender', genderValues);
      }
    }

    // Apply age range filter at database level
    if (filters.ageRange) {
      if (filters.ageRange[0] > 18) {
        query = query.gte('age', filters.ageRange[0]);
      }
      if (filters.ageRange[1] < 50) {
        query = query.lte('age', filters.ageRange[1]);
      }
    }

    return query;
  }, [filters.gender, filters.ageRange]);

  const fetchPage = useCallback(async (pageNum: number, append: boolean = false) => {
    const isFirstPage = pageNum === 0;
    
    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      setError(null);
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const query = buildQuery().range(from, to);
      const { data, error } = await query;

      if (error) throw error;

      // Filter out current user and blocked users client-side
      let filteredData = (data || []) as PaginatedRoomie[];
      if (user) {
        filteredData = filteredData.filter(p => p.user_id !== user.id);
      }
      if (blockedUserIds.size > 0) {
        filteredData = filteredData.filter(p => !blockedUserIds.has(p.user_id));
      }

      // Apply client-side filters that can't be done in query
      if (filters.hasProfileImage) {
        filteredData = filteredData.filter(p => p.avatar_url && p.avatar_url.length > 0);
      }

      if (filters.nationalities && filters.nationalities.length > 0) {
        filteredData = filteredData.filter(p => {
          if (!p.nationality) return false;
          return filters.nationalities!.some(n =>
            p.nationality?.toLowerCase().includes(n.toLowerCase())
          );
        });
      }

      if (filters.languages && filters.languages.length > 0) {
        filteredData = filteredData.filter(p => {
          if (!p.languages || p.languages.length === 0) return false;
          return filters.languages!.some(lang =>
            p.languages?.some((l: string) => l.toLowerCase().includes(lang.toLowerCase()))
          );
        });
      }

      if (append) {
        setRoomies(prev => [...prev, ...filteredData]);
      } else {
        setRoomies(filteredData);
      }

      setHasMore(data?.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching roomies:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke hente roomies');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [buildQuery, user, blockedUserIds, filters.hasProfileImage, filters.nationalities, filters.languages]);

  const loadMore = useCallback(() => {
    // Don't auto-refire a failed page — that turns a transient error into a tight
    // retry loop as the load-more observer keeps re-triggering on the same page.
    if (!isLoadingMore && hasMore && !error) {
      fetchPage(page + 1, true);
    }
  }, [fetchPage, page, isLoadingMore, hasMore, error]);

  const retry = useCallback(() => {
    setError(null);
    fetchPage(page + 1, true);
  }, [fetchPage, page]);

  const refresh = useCallback(() => {
    setRoomies([]);
    setPage(0);
    setHasMore(true);
    setError(null);
    fetchPage(0, false);
  }, [fetchPage]);

  // Initial fetch when filters change
  useEffect(() => {
    // Only fetch after blocked users are loaded
    if (user && blockedUserIds !== undefined) {
      refresh();
    } else if (!user) {
      refresh();
    }
  }, [filters.gender, filters.ageRange?.[0], filters.ageRange?.[1], 
      filters.hasProfileImage, blockedUserIds.size]);

  return {
    roomies,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    retry,
    refresh,
    totalLoaded: roomies.length,
  };
}
