import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationPartner {
  id: string;
  name: string;
  avatarUrl: string | null;
  conversationId: string;
}

export function useConversationPartners() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<ConversationPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPartners();
    } else {
      setPartners([]);
    }
  }, [user]);

  const fetchPartners = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get all conversations the user is part of
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError) throw partError;

      if (!participations || participations.length === 0) {
        setPartners([]);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);

      // Get other participants in these conversations
      const { data: otherParticipants, error: othersError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id);

      if (othersError) throw othersError;

      if (!otherParticipants || otherParticipants.length === 0) {
        setPartners([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(otherParticipants.map(p => p.user_id))];

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map to partners with conversation IDs
      const partnersData: ConversationPartner[] = otherParticipants.map(op => {
        const profile = profiles?.find(p => p.user_id === op.user_id);
        return {
          id: op.user_id,
          name: profile?.name || 'Ukendt',
          avatarUrl: profile?.avatar_url,
          conversationId: op.conversation_id,
        };
      });

      // Remove duplicates (keep first conversation per user)
      const uniquePartners = partnersData.filter(
        (partner, index, self) => 
          index === self.findIndex(p => p.id === partner.id)
      );

      setPartners(uniquePartners.slice(0, 7)); // Limit to 7 for arch display
    } catch (error) {
      console.error('Error fetching conversation partners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    partners,
    isLoading,
    refetch: fetchPartners,
  };
}
