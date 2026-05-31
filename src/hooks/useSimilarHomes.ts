import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SimilarHome {
  id: string;
  title: string;
  city: string;
  size_sqm: number | null;
  is_furnished: boolean | null;
  monthly_rent: number;
  images: string[] | null;
  user_id: string;
  landlord?: {
    name: string;
    avatar_url: string | null;
  };
}

/**
 * "Fordi du kunne lide …" — a similar-homes rail anchored on the user's most
 * recently favourited property. Finds other published homes in the same city
 * within ±25% of the anchor's rent. Returns nothing (empty homes) when the user
 * has no favourites or there are no comparable homes, so the section can hide.
 */
export const useSimilarHomes = (enabled: boolean) => {
  const { user } = useAuth();
  const [homes, setHomes] = useState<SimilarHome[]>([]);
  const [anchorTitle, setAnchorTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !user) {
      setHomes([]);
      setAnchorTitle(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSimilar = async () => {
      setLoading(true);

      // 1. The user's newest favourite (by when it was favourited).
      const { data: favRows } = await supabase
        .from("favorites")
        .select("property_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const anchorId = favRows?.[0]?.property_id;
      if (cancelled) return;
      if (!anchorId) {
        setHomes([]);
        setAnchorTitle(null);
        setLoading(false);
        return;
      }

      // 2. The anchor property itself — its city + rent drive the comparison.
      const { data: anchor } = await supabase
        .from("properties")
        .select("id, title, city, monthly_rent")
        .eq("id", anchorId)
        .maybeSingle();

      if (cancelled) return;
      if (!anchor) {
        setHomes([]);
        setAnchorTitle(null);
        setLoading(false);
        return;
      }

      setAnchorTitle(anchor.title);

      const minRent = Math.round(anchor.monthly_rent * 0.75);
      const maxRent = Math.round(anchor.monthly_rent * 1.25);

      // 3. Comparable published homes in the same city.
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id, title, city, size_sqm, is_furnished, monthly_rent, images, user_id"
        )
        .eq("is_published", true)
        .eq("city", anchor.city)
        .neq("id", anchor.id)
        .gte("monthly_rent", minRent)
        .lte("monthly_rent", maxRent)
        .order("created_at", { ascending: false })
        .limit(8);

      if (cancelled) return;

      if (error || !data?.length) {
        setHomes([]);
        setLoading(false);
        return;
      }

      // Hydrate landlord names/avatars in one round-trip.
      const landlordIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", landlordIds);

      if (cancelled) return;

      const withLandlord: SimilarHome[] = data.map((p) => ({
        ...p,
        landlord: profiles?.find((pr) => pr.user_id === p.user_id) ?? {
          name: "Ukendt",
          avatar_url: null,
        },
      }));

      setHomes(withLandlord);
      setLoading(false);
    };

    fetchSimilar();

    return () => {
      cancelled = true;
    };
  }, [enabled, user]);

  return { homes, anchorTitle, loading };
};
