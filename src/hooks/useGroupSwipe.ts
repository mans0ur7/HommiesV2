import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SwipeProperty {
  id: string;
  user_id: string;
  title: string;
  address: string | null;
  city: string | null;
  monthly_rent: number;
  size_sqm: number | null;
  room_count: number | null;
  images: string[] | null;
}

interface Vote {
  property_id: string;
  user_id: string;
  vote: "like" | "skip";
}

/**
 * "Swipe sammen som gruppe": hvert medlem stemmer like/skip på boliger. En bolig
 * som ALLE accepterede medlemmer (inkl. skaberen) har liket bliver et gruppe-match
 * som hele gruppen ser. Realtime, så medlemmer ser hinandens fremskridt straks.
 */
export function useGroupSwipe(groupId: string | null | undefined, enabled = true) {
  const { user } = useAuth();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [candidates, setCandidates] = useState<SwipeProperty[]>([]);
  const [matches, setMatches] = useState<SwipeProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!groupId || !user || !enabled) return;
    setLoading(true);

    // 1) Members: accepted members + creator
    const [{ data: members }, { data: group }] = await Promise.all([
      supabase.from("housing_group_members").select("user_id").eq("group_id", groupId).eq("status", "accepted"),
      supabase.from("housing_groups").select("created_by").eq("id", groupId).maybeSingle(),
    ]);
    const ids = new Set<string>((members ?? []).map((m: { user_id: string }) => m.user_id));
    if ((group as { created_by?: string } | null)?.created_by) ids.add((group as { created_by: string }).created_by);
    const memberIdList = [...ids];
    setMemberIds(memberIdList);

    // 2) All votes in the group
    const { data: voteRows } = await supabase
      .from("group_property_votes")
      .select("property_id, user_id, vote")
      .eq("group_id", groupId);
    const voteList = (voteRows ?? []) as Vote[];
    setVotes(voteList);

    const myVoted = new Set(voteList.filter((v) => v.user_id === user.id).map((v) => v.property_id));

    // 3) Matched properties = every current member liked it
    const likesByProperty = new Map<string, Set<string>>();
    for (const v of voteList) {
      if (v.vote !== "like" || !ids.has(v.user_id)) continue;
      if (!likesByProperty.has(v.property_id)) likesByProperty.set(v.property_id, new Set());
      likesByProperty.get(v.property_id)!.add(v.user_id);
    }
    const matchedIds = [...likesByProperty.entries()]
      .filter(([, set]) => memberIdList.length > 0 && set.size === memberIdList.length)
      .map(([pid]) => pid);

    // 4) Candidate deck: published, not expired, not owned by a member, not yet voted by me
    const nowIso = new Date().toISOString();
    const { data: props } = await supabase
      .from("properties")
      .select("id, user_id, title, address, city, monthly_rent, size_sqm, room_count, images")
      .eq("is_published", true)
      .or(`expires_at.gt.${nowIso},expires_at.is.null`)
      .order("created_at", { ascending: false })
      .limit(40);
    const deck = ((props ?? []) as SwipeProperty[]).filter((p) => !myVoted.has(p.id) && !ids.has(p.user_id));
    setCandidates(deck);

    // 5) Fetch matched property objects (may be outside the deck)
    if (matchedIds.length) {
      const { data: matchProps } = await supabase
        .from("properties")
        .select("id, user_id, title, address, city, monthly_rent, size_sqm, room_count, images")
        .in("id", matchedIds);
      setMatches((matchProps ?? []) as SwipeProperty[]);
    } else {
      setMatches([]);
    }

    setLoading(false);
  }, [groupId, user, enabled]);

  useEffect(() => {
    fetchAll();
    if (!groupId || !enabled) return;
    const channel = supabase
      .channel(`group-swipe-${groupId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_property_votes", filter: `group_id=eq.${groupId}` },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, groupId, enabled]);

  const vote = useCallback(
    async (propertyId: string, value: "like" | "skip") => {
      if (!groupId || !user) return;
      setCandidates((prev) => prev.filter((p) => p.id !== propertyId));
      await supabase.from("group_property_votes").upsert(
        { group_id: groupId, property_id: propertyId, user_id: user.id, vote: value },
        { onConflict: "group_id,property_id,user_id" },
      );
      fetchAll();
    },
    [groupId, user, fetchAll],
  );

  // How many current members have liked a given property (for "2/3 enige").
  const likeCount = useCallback(
    (propertyId: string) =>
      new Set(
        votes
          .filter((v) => v.property_id === propertyId && v.vote === "like" && memberIds.includes(v.user_id))
          .map((v) => v.user_id),
      ).size,
    [votes, memberIds],
  );

  return { memberIds, memberCount: memberIds.length, candidates, matches, loading, vote, likeCount, refetch: fetchAll };
}
