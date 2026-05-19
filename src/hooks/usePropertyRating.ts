import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RatableProperty {
  propertyId: string;
  propertyTitle: string;
  matchRequestId: string;
}

export const usePropertyRating = (conversationPropertyId?: string) => {
  const { user } = useAuth();
  const [canRate, setCanRate] = useState(false);
  const [ratableProperty, setRatableProperty] = useState<RatableProperty | null>(null);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !conversationPropertyId) {
      setLoading(false);
      return;
    }

    checkRatingEligibility();
  }, [user, conversationPropertyId]);

  const checkRatingEligibility = async () => {
    if (!user || !conversationPropertyId) return;

    try {
      // Check if user has an accepted match request for this property that's at least 7 days old
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: matchRequest, error: matchError } = await supabase
        .from("match_requests")
        .select("id, property_id, created_at")
        .eq("sender_id", user.id)
        .eq("property_id", conversationPropertyId)
        .eq("status", "accepted")
        .lte("created_at", sevenDaysAgo.toISOString())
        .single();

      if (matchError || !matchRequest) {
        setCanRate(false);
        setLoading(false);
        return;
      }

      // Check if user has already rated this property
      const { data: existingRating } = await supabase
        .from("ratings")
        .select("id")
        .eq("property_id", conversationPropertyId)
        .eq("user_id", user.id)
        .single();

      if (existingRating) {
        setHasRated(true);
        setCanRate(false);
        setLoading(false);
        return;
      }

      // Get property title
      const { data: property } = await supabase
        .from("properties")
        .select("title")
        .eq("id", conversationPropertyId)
        .single();

      setRatableProperty({
        propertyId: conversationPropertyId,
        propertyTitle: property?.title || "Annonce",
        matchRequestId: matchRequest.id,
      });
      setCanRate(true);
    } catch (error) {
      console.error("Error checking rating eligibility:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRated = () => {
    setHasRated(true);
    setCanRate(false);
    setRatableProperty(null);
  };

  return {
    canRate,
    ratableProperty,
    hasRated,
    loading,
    markAsRated,
    refetch: checkRatingEligibility,
  };
};
