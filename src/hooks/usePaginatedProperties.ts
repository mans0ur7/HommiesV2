import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PropertyFilters {
  city?: string;
  area?: string;
  priceRange?: [number, number];
  sizeRange?: [number, number];
  amenities?: string[];
  hasRoomImages?: boolean;
  hasFloorPlan?: boolean;
  genderComposition?: string;
  isFavorites?: boolean;
  favoriteIds?: string[];
  sortBy?: 'newest' | 'price-low' | 'price-high';
}

export interface PaginatedProperty {
  id: string;
  title: string;
  address: string;
  city: string;
  postal_code: string | null;
  monthly_rent: number;
  size_sqm: number | null;
  images: string[] | null;
  description: string | null;
  room_count: number | null;
  amenities: string[] | null;
  is_furnished: boolean | null;
  available_from: string | null;
  user_id: string;
  created_at: string;
  gender_composition: string | null;
  floor_plan_url: string | null;
  boost_started_at: string | null;
  boost_expires_at: string | null;
  rating_average: number | null;
  rating_count: number | null;
  latitude: number | null;
  longitude: number | null;
}

const PAGE_SIZE = 12;

export function usePaginatedProperties(filters: PropertyFilters = {}) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PaginatedProperty[]>([]);
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
      .from('properties')
      .select('*')
      .eq('is_published', true);

    // Apply city filter
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    // Apply area filter (on address)
    if (filters.area) {
      query = query.ilike('address', `%${filters.area}%`);
    }

    // Apply price range filter
    if (filters.priceRange) {
      if (filters.priceRange[0] > 0) {
        query = query.gte('monthly_rent', filters.priceRange[0]);
      }
      if (filters.priceRange[1] < 20000) {
        query = query.lte('monthly_rent', filters.priceRange[1]);
      }
    }

    // Apply size range filter
    if (filters.sizeRange) {
      if (filters.sizeRange[0] > 0) {
        query = query.gte('size_sqm', filters.sizeRange[0]);
      }
      if (filters.sizeRange[1] < 200) {
        query = query.lte('size_sqm', filters.sizeRange[1]);
      }
    }

    // Apply gender composition filter
    if (filters.genderComposition && filters.genderComposition !== 'all') {
      query = query.eq('gender_composition', filters.genderComposition);
    }

    // Apply favorites filter
    if (filters.isFavorites && filters.favoriteIds && filters.favoriteIds.length > 0) {
      query = query.in('id', filters.favoriteIds);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price-low':
        query = query.order('monthly_rent', { ascending: true });
        break;
      case 'price-high':
        query = query.order('monthly_rent', { ascending: false });
        break;
      case 'newest':
      default:
        // Sort by boost first, then by created_at
        query = query.order('boost_expires_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
        break;
    }

    return query;
  }, [filters]);

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

      // Filter out blocked users client-side
      let filteredData = data || [];
      if (blockedUserIds.size > 0) {
        filteredData = filteredData.filter(p => !blockedUserIds.has(p.user_id));
      }

      // Apply client-side filters that can't be done in query
      if (filters.hasRoomImages) {
        filteredData = filteredData.filter(p => p.images && p.images.length > 0);
      }
      if (filters.hasFloorPlan) {
        filteredData = filteredData.filter(p => p.floor_plan_url);
      }
      if (filters.amenities && filters.amenities.length > 0) {
        filteredData = filteredData.filter(p => {
          if (!p.amenities || p.amenities.length === 0) return false;
          return filters.amenities!.every(amenity =>
            p.amenities!.some((a: string) => a.toLowerCase().includes(amenity.toLowerCase()))
          );
        });
      }

      if (append) {
        setProperties(prev => [...prev, ...filteredData]);
      } else {
        setProperties(filteredData);
      }

      setHasMore(data?.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err instanceof Error ? err.message : 'Kunne ikke hente boliger');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [buildQuery, blockedUserIds, filters.hasRoomImages, filters.hasFloorPlan, filters.amenities]);

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
    setProperties([]);
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
  }, [filters.city, filters.area, filters.priceRange?.[0], filters.priceRange?.[1], 
      filters.sizeRange?.[0], filters.sizeRange?.[1], filters.genderComposition,
      filters.sortBy, filters.isFavorites, blockedUserIds.size]);

  return {
    properties,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    retry,
    refresh,
    totalLoaded: properties.length,
  };
}
