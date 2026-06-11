import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface RoomieReview {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: { name: string; avatar_url: string | null };
}

/**
 * Anmeldelser + omdømme for en bruger (reviewee). Henter modtagne anmeldelser,
 * beriger med anmelderens navn/avatar, regner gennemsnit/antal, og afgør om den
 * aktuelle bruger må anmelde (kræver accepteret match/connection — håndhæves også
 * server-side i guard_roomie_review).
 */
export function useRoomieReviews(userId?: string | null) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<RoomieReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [canConnect, setCanConnect] = useState(false);

  const isOwn = !!user && user.id === userId;

  const fetchReviews = useCallback(async () => {
    if (!userId) {
      setReviews([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("roomie_reviews")
      .select("id, reviewer_id, reviewee_id, rating, comment, created_at")
      .eq("reviewee_id", userId)
      .order("created_at", { ascending: false });

    const list = (data ?? []) as RoomieReview[];
    const ids = [...new Set(list.map((r) => r.reviewer_id))];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", ids);
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));
      list.forEach((r) => {
        const p = map.get(r.reviewer_id);
        if (p) r.reviewer = { name: p.name, avatar_url: p.avatar_url };
      });
    }
    setReviews(list);
    setLoading(false);
  }, [userId]);

  const checkCanConnect = useCallback(async () => {
    if (!user || !userId || user.id === userId) {
      setCanConnect(false);
      return;
    }
    const { data: m } = await supabase
      .from("match_requests")
      .select("id")
      .eq("status", "accepted")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .limit(1);
    if (m && m.length) {
      setCanConnect(true);
      return;
    }
    const { data: c } = await supabase
      .from("connections")
      .select("id")
      .or(`and(user_id.eq.${user.id},target_user_id.eq.${userId}),and(user_id.eq.${userId},target_user_id.eq.${user.id})`)
      .limit(1);
    setCanConnect(!!(c && c.length));
  }, [user, userId]);

  useEffect(() => {
    fetchReviews();
    checkCanConnect();
  }, [fetchReviews, checkCanConnect]);

  const submit = async (rating: number, comment: string) => {
    if (!user || !userId) return { error: new Error("not-allowed") };
    const { error } = await supabase.from("roomie_reviews").upsert(
      { reviewer_id: user.id, reviewee_id: userId, rating, comment: comment.trim() || null },
      { onConflict: "reviewer_id,reviewee_id" },
    );
    if (!error) await fetchReviews();
    return { error };
  };

  const remove = async () => {
    if (!user || !userId) return;
    await supabase.from("roomie_reviews").delete().eq("reviewer_id", user.id).eq("reviewee_id", userId);
    await fetchReviews();
  };

  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const myReview = reviews.find((r) => r.reviewer_id === user?.id) ?? null;

  return {
    reviews,
    loading,
    count,
    average,
    myReview,
    isOwn,
    canReview: canConnect && !isOwn,
    submit,
    remove,
    refetch: fetchReviews,
  };
}
