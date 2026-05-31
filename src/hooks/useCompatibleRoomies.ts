import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePaginatedRoomies, type PaginatedRoomie } from "./usePaginatedRoomies";

export interface CompatibleRoomie {
  roomie: PaginatedRoomie;
  score: number;
  /** Intersection of the user's and the candidate's personality+lifestyle tags. */
  sharedTags: string[];
}

const TOP_N = 8;

/**
 * "Matcher dig" — scores roomie candidates against the current user's profile
 * and returns the best matches. Each shared personality/lifestyle tag and a
 * budget-closeness term drive the score, so the personality & lifestyle data
 * users fill in finally pays off. Returns an empty list when the user hasn't set
 * any traits or there are no candidates, so the section can hide.
 */
export const useCompatibleRoomies = (enabled: boolean) => {
  const { profile } = useAuth();
  // Reuse the explore roomie list — it already returns name, avatar, age, study,
  // personality, lifestyle, monthly_budget and filters out me + blocked users.
  const { roomies, isLoading } = usePaginatedRoomies();

  const myPersonality = profile?.personality ?? [];
  const myLifestyle = profile?.lifestyle ?? [];
  const myBudget = profile?.monthly_budget ?? null;
  // profiles have no city column today; guard so the same-city bonus is a no-op
  // if/when one is added without breaking types.
  const myCity = (profile as { city?: string | null } | null)?.city ?? null;

  const hasTraits = myPersonality.length > 0 || myLifestyle.length > 0;

  const compatible = useMemo<CompatibleRoomie[]>(() => {
    if (!enabled || !hasTraits || roomies.length === 0) return [];

    const myPersonalitySet = new Set(myPersonality);
    const myLifestyleSet = new Set(myLifestyle);

    const scored = roomies.map((roomie) => {
      const sharedPersonality = (roomie.personality ?? []).filter((t) =>
        myPersonalitySet.has(t)
      );
      const sharedLifestyle = (roomie.lifestyle ?? []).filter((t) =>
        myLifestyleSet.has(t)
      );

      let score = sharedPersonality.length * 3 + sharedLifestyle.length * 3;

      // Budget closeness: full bonus when identical, fading to 0 at ±50%.
      if (myBudget && roomie.monthly_budget) {
        const diffRatio =
          Math.abs(roomie.monthly_budget - myBudget) / myBudget;
        score += Math.max(0, 4 * (1 - diffRatio / 0.5));
      }

      // Small bonus for the same city (no-op until profiles store a city).
      const roomieCity = (roomie as { city?: string | null }).city ?? null;
      if (myCity && roomieCity && myCity === roomieCity) {
        score += 2;
      }

      return {
        roomie,
        score,
        sharedTags: [...sharedPersonality, ...sharedLifestyle],
      };
    });

    return scored
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
  }, [
    enabled,
    hasTraits,
    roomies,
    myPersonality,
    myLifestyle,
    myBudget,
    myCity,
  ]);

  return { compatible, hasTraits, loading: isLoading };
};
