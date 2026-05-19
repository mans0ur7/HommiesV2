import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SearchAgent {
  id: string;
  user_id: string;
  name: string;
  city: string | null;
  area: string | null;
  min_rent: number | null;
  max_rent: number | null;
  min_rooms: number | null;
  max_rooms: number | null;
  property_type: string | null;
  is_active: boolean;
  notification_frequency: string;
  email_notifications: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSearchAgentData {
  name: string;
  city?: string | null;
  area?: string | null;
  min_rent?: number | null;
  max_rent?: number | null;
  min_rooms?: number | null;
  max_rooms?: number | null;
  property_type?: string | null;
  notification_frequency?: string;
  email_notifications?: boolean;
}

export const useSearchAgents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: searchAgents = [], isLoading } = useQuery({
    queryKey: ['search-agents', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('search_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SearchAgent[];
    },
    enabled: !!user?.id,
  });

  const createAgent = useMutation({
    mutationFn: async (agentData: CreateSearchAgentData) => {
      if (!user?.id) throw new Error('Ikke logget ind');
      
      const { data, error } = await supabase
        .from('search_agents')
        .insert({
          user_id: user.id,
          name: agentData.name,
          city: agentData.city || null,
          area: agentData.area || null,
          min_rent: agentData.min_rent || null,
          max_rent: agentData.max_rent || null,
          min_rooms: agentData.min_rooms || null,
          max_rooms: agentData.max_rooms || null,
          property_type: agentData.property_type || null,
          notification_frequency: agentData.notification_frequency || 'instant',
          email_notifications: agentData.email_notifications ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-agents'] });
      toast.success('Søgeagent oprettet!');
    },
    onError: (error) => {
      console.error('Error creating search agent:', error);
      toast.error('Kunne ikke oprette søgeagent');
    },
  });

  const updateAgent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SearchAgent> & { id: string }) => {
      const { data, error } = await supabase
        .from('search_agents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-agents'] });
      toast.success('Søgeagent opdateret!');
    },
    onError: (error) => {
      console.error('Error updating search agent:', error);
      toast.error('Kunne ikke opdatere søgeagent');
    },
  });

  const deleteAgent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('search_agents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-agents'] });
      toast.success('Søgeagent slettet');
    },
    onError: (error) => {
      console.error('Error deleting search agent:', error);
      toast.error('Kunne ikke slette søgeagent');
    },
  });

  const toggleAgent = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('search_agents')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['search-agents'] });
      toast.success(data.is_active ? 'Søgeagent aktiveret' : 'Søgeagent deaktiveret');
    },
    onError: (error) => {
      console.error('Error toggling search agent:', error);
      toast.error('Kunne ikke ændre søgeagent');
    },
  });

  return {
    searchAgents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgent,
  };
};
