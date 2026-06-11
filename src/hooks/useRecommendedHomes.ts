import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchAgents } from "@/hooks/useSearchAgents";
import { dawaCityQueryPrefix } from "@/data/danishCities";

export interface RecommendedHome {
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
 * A robust "recommended for you" rail: the most recent published homes,
 * optionally narrowed to the city of the user's most recent active search
 * agent. Intentionally a plain recent-homes query (no edge function) so it
 * stays reliable for every roomie.
 */
export const useRecommendedHomes = (enabled: boolean) => {
  const { searchAgents } = useSearchAgents();
  const [homes, setHomes] = useState<RecommendedHome[]>([]);
  const [loading, setLoading] = useState(true);

  // City of the most recent active search agent that has a city, if any.
  const preferredCity =
    searchAgents?.find((a) => a.is_active && a.city)?.city ?? null;

  useEffect(() => {
    if (!enabled) {
      setHomes([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchHomes = async () => {
      setLoading(true);

      let query = supabase
        .from("properties")
        .select(
          "id, title, city, size_sqm, is_furnished, monthly_rent, images, user_id"
        )
        .eq("is_published", true)
        .or(`expires_at.gt.${new Date().toISOString()},expires_at.is.null`)
        .order("created_at", { ascending: false })
        .limit(8);

      if (preferredCity) {
        // properties.city er DAWA-postnrnavne ("København N") — prefix-match i stedet
        // for eksakt lighed, så "København" og bydele som "Nørrebro" også rammer.
        query = query.ilike("city", `${dawaCityQueryPrefix(preferredCity)}%`);
      }

      const { data, error } = await query;

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

      const withLandlord: RecommendedHome[] = data.map((p) => ({
        ...p,
        landlord: profiles?.find((pr) => pr.user_id === p.user_id) ?? {
          name: "Ukendt",
          avatar_url: null,
        },
      }));

      setHomes(withLandlord);
      setLoading(false);
    };

    fetchHomes();

    return () => {
      cancelled = true;
    };
  }, [enabled, preferredCity]);

  return { homes, loading };
};
