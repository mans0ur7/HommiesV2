import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RoomieProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  study: string | null;
  work: string | null;
  age: number | null;
  gender: string | null;
  nationality: string | null;
}

export function useRoomieProfiles() {
  const { user } = useAuth();
  const [roomies, setRoomies] = useState<RoomieProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRoomies();
  }, [user]);

  const fetchRoomies = async () => {
    setIsLoading(true);
    try {
      // Get blocked users if logged in
      let blockedUserIds: Set<string> = new Set();
      if (user) {
        const { data: blocked } = await supabase
          .from('blocked_users')
          .select('blocked_user_id')
          .eq('user_id', user.id);
        blockedUserIds = new Set(blocked?.map(b => b.blocked_user_id).filter(Boolean) || []);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, name, avatar_url, study, work, age, gender, nationality, hidden_from_explore')
        .eq('user_type', 'roomie')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out current user, blocked users, and hidden profiles
      const filteredData = (data || []).filter(profile => {
        if (user && profile.user_id === user.id) return false;
        if (blockedUserIds.has(profile.user_id)) return false;
        // Filter out profiles hidden from explore
        if ((profile as any).hidden_from_explore === true) return false;
        return true;
      });
      
      setRoomies(filteredData);
    } catch (error) {
      console.error('Error fetching roomies:', error);
      setRoomies([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    roomies,
    isLoading,
    refetch: fetchRoomies,
  };
}
