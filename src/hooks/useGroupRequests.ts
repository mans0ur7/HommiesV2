import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface GroupRequest {
  id: string;
  group_id: string;
  property_id: string;
  landlord_id: string;
  status: "pending" | "accepted" | "rejected";
  message: string | null;
  desired_rooms: number | null;
  created_at: string;
  updated_at: string;
  group?: {
    id: string;
    name: string;
    members: {
      user_id: string;
      status: string;
      profile?: {
        name: string;
        avatar_url: string | null;
        age: number | null;
        study: string | null;
        bio: string | null;
      };
    }[];
  };
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    images: string[] | null;
    available_rooms: number | null;
  };
}

export const useGroupRequests = () => {
  const { user, profile } = useAuth();
  const [sentRequests, setSentRequests] = useState<GroupRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<GroupRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch requests sent by groups the user is part of
      const { data: memberData } = await supabase
        .from("housing_group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const { data: createdGroups } = await supabase
        .from("housing_groups")
        .select("id")
        .eq("created_by", user.id);

      const groupIds = [
        ...(memberData?.map(m => m.group_id) || []),
        ...(createdGroups?.map(g => g.id) || []),
      ];

      if (groupIds.length > 0) {
        const { data: sent } = await supabase
          .from("group_requests")
          .select("*")
          .in("group_id", groupIds)
          .order("created_at", { ascending: false });

        if (sent) {
          const sentWithDetails = await enrichRequests(sent);
          setSentRequests(sentWithDetails);
        }
      }

      // If user is landlord, fetch received requests
      if (profile?.user_type === "landlord") {
        const { data: received } = await supabase
          .from("group_requests")
          .select("*")
          .eq("landlord_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (received) {
          const receivedWithDetails = await enrichRequests(received);
          setReceivedRequests(receivedWithDetails);
        }
      }
    } catch (error) {
      console.error("Error fetching group requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const enrichRequests = async (requests: any[]): Promise<GroupRequest[]> => {
    return Promise.all(
      requests.map(async (req) => {
        // Fetch group with members and creator
        const { data: group } = await supabase
          .from("housing_groups")
          .select("id, name, created_by")
          .eq("id", req.group_id)
          .maybeSingle();

        let groupWithMembers = null;
        if (group) {
          const { data: members } = await supabase
            .from("housing_group_members")
            .select("user_id, status")
            .eq("group_id", group.id)
            .eq("status", "accepted");

          // Fetch creator profile
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("name, avatar_url, age, study, bio")
            .eq("user_id", group.created_by)
            .maybeSingle();

          // Get profiles for all members
          const membersWithProfiles = await Promise.all(
            (members || []).map(async (m) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("name, avatar_url, age, study, bio")
                .eq("user_id", m.user_id)
                .maybeSingle();
              return { ...m, profile };
            })
          );

          // Add creator to the members list if not already there
          const creatorInMembers = membersWithProfiles.some(m => m.user_id === group.created_by);
          const allMembers = creatorInMembers 
            ? membersWithProfiles 
            : [
                { user_id: group.created_by, status: "accepted", profile: creatorProfile },
                ...membersWithProfiles
              ];

          groupWithMembers = {
            ...group,
            members: allMembers,
          };
        }

        // Fetch property
        const { data: property } = await supabase
          .from("properties")
          .select("id, title, address, city, images, available_rooms")
          .eq("id", req.property_id)
          .maybeSingle();

        return {
          ...req,
          status: req.status as "pending" | "accepted" | "rejected",
          group: groupWithMembers,
          property,
        };
      })
    );
  };

  const sendGroupRequest = async (data: {
    group_id: string;
    property_id: string;
    landlord_id: string;
    message?: string;
    desired_rooms?: number;
  }) => {
    const { error } = await supabase.from("group_requests").insert(data);

    if (error) {
      console.error("Error sending group request:", error);
      return false;
    }

    await fetchRequests();
    return true;
  };

  const respondToRequest = async (requestId: string, accept: boolean): Promise<{ success: boolean; conversationId?: string }> => {
    try {
      // First fetch the request details before updating
      const { data: request, error: fetchError } = await supabase
        .from("group_requests")
        .select("*, housing_groups!inner(id, name, created_by)")
        .eq("id", requestId)
        .single();

      if (fetchError || !request) {
        console.error("Error fetching group request:", fetchError);
        return { success: false };
      }

      // Update the status
      const { error } = await supabase
        .from("group_requests")
        .update({ status: accept ? "accepted" : "rejected" })
        .eq("id", requestId);

      if (error) {
        console.error("Error responding to group request:", error);
        return { success: false };
      }

      let conversationId: string | undefined;

      // If accepted, create a landlord-group conversation using edge function
      if (accept) {
        // Use the edge function to create conversation (bypasses RLS)
        // Type "landlord" with group_id creates a separate chat from internal group chat
        const { data: convData, error: convError } = await supabase.functions.invoke("create-conversation", {
          body: {
            type: "landlord",
            group_id: request.group_id,
            property_id: request.property_id,
          },
        });

        if (convError) {
          console.error("Error creating conversation:", convError);
        } else if (convData?.conversation?.id) {
          conversationId = convData.conversation.id;
        }
      }

      await fetchRequests();
      return { success: true, conversationId };
    } catch (error) {
      console.error("Error in respondToRequest:", error);
      return { success: false };
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, profile]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`group-requests-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "group_requests",
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    sentRequests,
    receivedRequests,
    loading,
    sendGroupRequest,
    respondToRequest,
    refetch: fetchRequests,
  };
};
