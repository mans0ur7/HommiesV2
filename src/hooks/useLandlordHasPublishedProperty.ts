import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useLandlordHasPublishedProperty = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const isLandlord = profile?.user_type === "landlord";
  const isRoomie = profile?.user_type === "roomie";

  const { data: hasPublishedProperty = false, isLoading: queryLoading } = useQuery({
    queryKey: ['landlord-has-published-property', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_published', true);
      
      if (error) {
        console.error('Error checking published properties:', error);
        return false;
      }
      
      return (count || 0) > 0;
    },
    enabled: !!user?.id && isLandlord,
  });

  // While profile is loading, default to allowing access (will be recalculated when loaded)
  // For roomies, they can always access roomie features
  // For landlords, they need at least one published property
  const isLoading = authLoading || (isLandlord && queryLoading);
  
  // If profile hasn't loaded yet, default to true to avoid flash of locked state
  // Once profile loads, apply proper rules
  const canAccessRoomieFeatures = !profile 
    ? true  // Default to unlocked while loading
    : isRoomie 
      ? true 
      : (isLandlord ? hasPublishedProperty : true);

  return {
    hasPublishedProperty,
    canAccessRoomieFeatures,
    isLoading,
    isLandlord,
  };
};
