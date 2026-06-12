import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { HousingGroup } from "@/hooks/useHousingGroups";

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

export interface GroupVote {
  property_id: string;
  user_id: string;
  vote: "like" | "skip";
}

const PAGE_SIZE = 40;
const DECK_TARGET = 25;
const MAX_PAGES = 5;

/**
 * "Swipe sammen som gruppe": hvert medlem stemmer like/skip på boliger. En bolig
 * som ALLE accepterede medlemmer (inkl. skaberen) har liket bliver et gruppe-match
 * som hele gruppen ser. Realtime, så medlemmer ser hinandens fremskridt straks.
 */
export function useGroupSwipe(group: HousingGroup | null | undefined, enabled = true) {
  const { user } = useAuth();
  const groupId = group?.id ?? null;
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [votes, setVotes] = useState<GroupVote[]>([]);
  const [candidates, setCandidates] = useState<SwipeProperty[]>([]);
  const [matches, setMatches] = useState<SwipeProperty[]>([]);
  const [loading, setLoading] = useState(false);
  // Skeleton kun ved første load — refetch efter swipes/realtime må ikke
  // unmounte hele dækket til en pulserende skeleton midt i interaktionen.
  const hasLoadedRef = useRef(false);

  const fetchAll = useCallback(async () => {
    if (!groupId || !user || !enabled) return;
    if (!hasLoadedRef.current) setLoading(true);

    // 1) Members (accepted + creator) og brugere jeg har blokeret
    const [{ data: members, error: memberErr }, { data: grp }, { data: blockedRows }] = await Promise.all([
      supabase.from("housing_group_members").select("user_id").eq("group_id", groupId).eq("status", "accepted"),
      supabase.from("housing_groups").select("created_by").eq("id", groupId).maybeSingle(),
      supabase.from("blocked_users").select("blocked_user_id").eq("user_id", user.id),
    ]);
    if (memberErr) {
      console.error("[group-swipe] member fetch failed", memberErr);
      setLoading(false);
      return; // behold eksisterende state frem for at vise et tomt/forkert dæk
    }
    const ids = new Set<string>((members ?? []).map((m: { user_id: string }) => m.user_id));
    if ((grp as { created_by?: string } | null)?.created_by) ids.add((grp as { created_by: string }).created_by);
    const memberIdList = [...ids];
    setMemberIds(memberIdList);
    const blockedIds = new Set<string>((blockedRows ?? []).map((b: { blocked_user_id: string }) => b.blocked_user_id).filter(Boolean));

    // 2) Alle stemmer i gruppen
    const { data: voteRows, error: voteErr } = await supabase
      .from("group_property_votes")
      .select("property_id, user_id, vote")
      .eq("group_id", groupId);
    if (voteErr) {
      console.error("[group-swipe] vote fetch failed", voteErr);
      setLoading(false);
      return;
    }
    const voteList = (voteRows ?? []) as GroupVote[];
    setVotes(voteList);

    const myVoted = new Set(voteList.filter((v) => v.user_id === user.id).map((v) => v.property_id));

    // 3) Matchede boliger = alle nuværende medlemmer har liket (kræver en
    //    egentlig gruppe på mindst 2 — ellers er "alle enige" meningsløst).
    const likesByProperty = new Map<string, Set<string>>();
    for (const v of voteList) {
      if (v.vote !== "like" || !ids.has(v.user_id)) continue;
      if (!likesByProperty.has(v.property_id)) likesByProperty.set(v.property_id, new Set());
      likesByProperty.get(v.property_id)!.add(v.user_id);
    }
    const matchedIds = [...likesByProperty.entries()]
      .filter(([, set]) => memberIdList.length >= 2 && set.size === memberIdList.length)
      .map(([pid]) => pid);

    // 4) Kandidat-dæk. Allerede-stemte boliger frafiltreres KLIENT-side, så vi
    //    pagineres med keyset (created_at) til dækket er fyldt — ellers løber
    //    dækket permanent tørt efter PAGE_SIZE stemmer, selvom der er flere
    //    usete boliger længere nede i listen.
    const nowIso = new Date().toISOString();
    const maxRent = group?.budget_per_person
      ? group.budget_per_person * Math.max(memberIdList.length, group.desired_rooms ?? 1)
      : null;
    const deck: SwipeProperty[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < MAX_PAGES && deck.length < DECK_TARGET; page++) {
      let q = supabase
        .from("properties")
        .select("id, user_id, title, address, city, monthly_rent, size_sqm, room_count, images, created_at")
        .eq("is_published", true)
        .or(`expires_at.gt.${nowIso},expires_at.is.null`)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (group?.city) q = q.ilike("city", `%${group.city}%`);
      if (maxRent) q = q.lte("monthly_rent", maxRent);
      if (cursor) q = q.lt("created_at", cursor);
      const { data: props, error: propErr } = await q;
      if (propErr) {
        console.error("[group-swipe] property fetch failed", propErr);
        break;
      }
      const rows = (props ?? []) as (SwipeProperty & { created_at: string })[];
      if (!rows.length) break;
      cursor = rows[rows.length - 1].created_at;
      for (const p of rows) {
        if (!myVoted.has(p.id) && !ids.has(p.user_id) && !blockedIds.has(p.user_id)) {
          const { created_at: _omit, ...prop } = p;
          deck.push(prop);
        }
      }
      if (rows.length < PAGE_SIZE) break;
    }
    setCandidates(deck);

    // 5) Matchede bolig-objekter — kun aktive (udløbne/afpublicerede ryger ud,
    //    så "Kontakt udlejer" aldrig peger på en død annonce).
    if (matchedIds.length) {
      const { data: matchProps, error: matchErr } = await supabase
        .from("properties")
        .select("id, user_id, title, address, city, monthly_rent, size_sqm, room_count, images")
        .in("id", matchedIds)
        .eq("is_published", true)
        .or(`expires_at.gt.${nowIso},expires_at.is.null`);
      if (matchErr) console.error("[group-swipe] match fetch failed", matchErr);
      else setMatches((matchProps ?? []) as SwipeProperty[]);
    } else {
      setMatches([]);
    }

    hasLoadedRef.current = true;
    setLoading(false);
  }, [groupId, group?.city, group?.budget_per_person, group?.desired_rooms, user, enabled]);

  useEffect(() => {
    hasLoadedRef.current = false;
    fetchAll();
    if (!groupId || !enabled) return;
    const channel = supabase
      .channel(`group-swipe-${groupId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_property_votes", filter: `group_id=eq.${groupId}` },
        () => fetchAll(),
      )
      // Medlemskab ændrer både nævneren i "X/Y enige" og match-beregningen.
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "housing_group_members", filter: `group_id=eq.${groupId}` },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, groupId, enabled]);

  const vote = useCallback(
    async (propertyId: string, value: "like" | "skip") => {
      if (!groupId || !user) return false;
      setCandidates((prev) => prev.filter((p) => p.id !== propertyId));
      const { error } = await supabase.from("group_property_votes").upsert(
        { group_id: groupId, property_id: propertyId, user_id: user.id, vote: value },
        { onConflict: "group_id,property_id,user_id" },
      );
      if (error) {
        console.error("[group-swipe] vote failed", error);
        toast.error("Dit svar blev ikke gemt — prøv igen");
        fetchAll(); // genskab serverens sandhed (boligen kommer tilbage i dækket)
        return false;
      }
      fetchAll();
      return true;
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

  return { memberIds, memberCount: memberIds.length, votes, candidates, matches, loading, vote, likeCount, refetch: fetchAll };
}
