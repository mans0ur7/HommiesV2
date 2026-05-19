import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from './useFavorites';

interface FavoriteProperty {
  id: string;
  title: string;
  city: string;
  size_sqm: number | null;
  is_furnished: boolean | null;
  monthly_rent: number;
  images: string[] | null;
  user_id: string;
  landlord?: {
    name: string;
    avatar_url: string | null;
  };
}

export function useFavoriteProperties() {
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [properties, setProperties] = useState<FavoriteProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && favorites.length > 0) {
      fetchFavoriteProperties();
    } else {
      setProperties([]);
    }
  }, [user, favorites]);

  const fetchFavoriteProperties = async () => {
    if (!user || favorites.length === 0) return;
    
    setIsLoading(true);
    try {
      // Fetch properties that are in favorites
      const { data: propertiesData, error: propsError } = await supabase
        .from('properties')
        .select('id, title, city, size_sqm, is_furnished, monthly_rent, images, user_id')
        .in('id', favorites);

      if (propsError) throw propsError;

      if (!propertiesData || propertiesData.length === 0) {
        setProperties([]);
        return;
      }

      // Get landlord profiles
      const landlordIds = [...new Set(propertiesData.map(p => p.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', landlordIds);

      if (profilesError) throw profilesError;

      // Map properties with landlord info
      const propertiesWithLandlord = propertiesData.map(prop => ({
        ...prop,
        landlord: profiles?.find(p => p.user_id === prop.user_id) || { name: 'Ukendt', avatar_url: null }
      }));

      setProperties(propertiesWithLandlord);
    } catch (error) {
      console.error('Error fetching favorite properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    properties,
    isLoading,
    refetch: fetchFavoriteProperties,
  };
}
