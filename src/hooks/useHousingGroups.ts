import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HousingGroup {
  id: string;
  name: string;
  created_by: string;
  city: string | null;
  area: string | null;
  budget_per_person: number | null;
  budget_total: number | null;
  desired_rooms: number | null;
  created_at: string;
  updated_at: string;
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  status: "pending" | "accepted" | "declined";
  invited_by: string;
  invited_at: string;
  responded_at: string | null;
  profile?: {
    name: string;
    avatar_url: string | null;
    age: number | null;
  };
}

export const useHousingGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<HousingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState<GroupMember[]>([]);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch groups where user is creator or accepted member
      const { data: memberData } = await supabase
        .from("housing_group_members")
        .select("group_id")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const memberGroupIds = memberData?.map(m => m.group_id) || [];

      const { data: createdGroups } = await supabase
        .from("housing_groups")
        .select("*")
        .eq("created_by", user.id);

      const createdGroupIds = createdGroups?.map(g => g.id) || [];
      const allGroupIds = [...new Set([...memberGroupIds, ...createdGroupIds])];

      if (allGroupIds.length === 0) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Fetch all groups
      const { data: groupsData } = await supabase
        .from("housing_groups")
        .select("*")
        .in("id", allGroupIds);

      if (!groupsData) {
        setGroups([]);
        setLoading(false);
        return;
      }

      // Fetch members for each group
      const groupsWithMembers = await Promise.all(
        groupsData.map(async (group) => {
          const { data: members } = await supabase
            .from("housing_group_members")
            .select("*")
            .eq("group_id", group.id);

          // Fetch profiles for members
          const membersWithProfiles = await Promise.all(
            (members || []).map(async (member) => {
              const { data: profile } = await supabase
                .from("profiles")
                .select("name, avatar_url, age")
                .eq("user_id", member.user_id)
                .maybeSingle();

              return {
                ...member,
                status: member.status as "pending" | "accepted" | "declined",
                profile,
              };
            })
          );

          // Also add creator as a virtual member if not in members list
          const creatorInMembers = membersWithProfiles.some(m => m.user_id === group.created_by);
          if (!creatorInMembers) {
            const { data: creatorProfile } = await supabase
              .from("profiles")
              .select("name, avatar_url, age")
              .eq("user_id", group.created_by)
              .maybeSingle();

            membersWithProfiles.unshift({
              id: `creator-${group.id}`,
              group_id: group.id,
              user_id: group.created_by,
              status: "accepted" as const,
              invited_by: group.created_by,
              invited_at: group.created_at,
              responded_at: group.created_at,
              profile: creatorProfile,
            });
          }

          return {
            ...group,
            members: membersWithProfiles,
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("housing_group_members")
      .select("*, housing_groups(*)")
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (data) {
      // Fetch inviter profiles
      const invitationsWithProfiles = await Promise.all(
        data.map(async (inv) => {
          const { data: inviterProfile } = await supabase
            .from("profiles")
            .select("name, avatar_url, age")
            .eq("user_id", inv.invited_by)
            .maybeSingle();

          return {
            ...inv,
            status: inv.status as "pending" | "accepted" | "declined",
            inviterProfile,
          };
        })
      );

      setPendingInvitations(invitationsWithProfiles);
    }
  };

  const createGroup = async (data: {
    name: string;
    city?: string;
    area?: string;
    budget_per_person?: number;
    budget_total?: number;
    desired_rooms?: number;
  }) => {
    if (!user) return null;

    // Use backend function to avoid RLS edge cases on INSERT.
    const { data: resp, error } = await supabase.functions.invoke("create-housing-group", {
      body: {
        ...data,
      },
    });

    if (error) {
      console.error("Error creating group:", error);
      return null;
    }

    const group = (resp as any)?.group;
    if (!group) return null;

    await fetchGroups();
    return group;
  };

  const inviteMember = async (groupId: string, userId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("housing_group_members")
      .insert({
        group_id: groupId,
        user_id: userId,
        invited_by: user.id,
        status: "pending",
      });

    if (error) {
      console.error("Error inviting member:", error);
      return false;
    }

    await fetchGroups();
    return true;
  };

  const respondToInvitation = async (memberId: string, accept: boolean) => {
    const { error } = await supabase
      .from("housing_group_members")
      .update({
        status: accept ? "accepted" : "declined",
        responded_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) {
      console.error("Error responding to invitation:", error);
      return false;
    }

    await Promise.all([fetchGroups(), fetchPendingInvitations()]);
    return true;
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase
      .from("housing_groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      console.error("Error deleting group:", error);
      return false;
    }

    await fetchGroups();
    return true;
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from("housing_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error leaving group:", error);
      return false;
    }

    await fetchGroups();
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchPendingInvitations();
    }
  }, [user]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`housing-groups-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "housing_group_members",
        },
        () => {
          fetchGroups();
          fetchPendingInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    groups,
    loading,
    pendingInvitations,
    createGroup,
    inviteMember,
    respondToInvitation,
    deleteGroup,
    leaveGroup,
    refetch: fetchGroups,
  };
};
