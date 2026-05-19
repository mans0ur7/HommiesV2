import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavorites(data?.map(f => f.property_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (propertyId: string) => {
    if (!user) {
      toast.error('Log ind for at gemme favoritter');
      return;
    }

    const isFavorited = favorites.includes(propertyId);
    
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) throw error;
        setFavorites(prev => prev.filter(id => id !== propertyId));
        toast.success('Fjernet fra favoritter');
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: user.id, property_id: propertyId });

        if (error) throw error;
        setFavorites(prev => [...prev, propertyId]);
        toast.success('Tilføjet til favoritter');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Kunne ikke opdatere favoritter');
    }
  };

  const isFavorite = (propertyId: string) => favorites.includes(propertyId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}
