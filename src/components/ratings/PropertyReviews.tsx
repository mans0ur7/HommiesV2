import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import StarRating from "./StarRating";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { da } from "date-fns/locale";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user: {
    name: string;
    avatar_url: string | null;
  };
}

interface ReviewProfile {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

interface PropertyReviewsProps {
  propertyId: string;
}

const PropertyReviews = ({ propertyId }: PropertyReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      const { data: ratings, error } = await supabase
        .from("ratings")
        .select("id, rating, comment, created_at, user_id")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!ratings || ratings.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // Fetch user profiles for each rating
      const userIds = ratings.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map<string, ReviewProfile>((profiles as ReviewProfile[] | null)?.map((p) => [p.user_id, p]) || []);

      const reviewsWithUsers: Review[] = ratings.map(rating => {
        const profile = profileMap.get(rating.user_id);
        return {
          id: rating.id,
          rating: rating.rating,
          comment: rating.comment,
          created_at: rating.created_at,
          user: {
            name: profile?.name || "Anonym",
            avatar_url: profile?.avatar_url || null,
          },
        };
      });

      setReviews(reviewsWithUsers);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-32 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-muted rounded-2xl"></div>
          <div className="h-32 bg-muted rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return null;
  }

  const displayedReviews = showAll ? reviews : reviews.slice(0, 4);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Anmeldelser</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedReviews.map((review) => (
          <div
            key={review.id}
            className="border border-border rounded-2xl p-4 bg-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.user.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {review.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{review.user.name}</p>
                <StarRating rating={review.rating} size="sm" />
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {review.comment}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(review.created_at), "d. MMM yyyy", { locale: da })}
            </p>
          </div>
        ))}
      </div>
      {reviews.length > 4 && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Vis færre" : `Vis alle (${reviews.length})`}
        </Button>
      )}
    </div>
  );
};

export default PropertyReviews;
