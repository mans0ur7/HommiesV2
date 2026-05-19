import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Fallback room photos used only until we have real published listings.
// They will be automatically replaced by real property images once they exist.
const FALLBACK_ROOM_IMAGES = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522444195799-478538b28823?w=1600&auto=format&fit=crop",
];

/**
 * Returns a pool of showcase room images.
 * Pulls real images from published properties when available,
 * otherwise falls back to curated fake room photos.
 */
export const useShowcaseImages = (limit = 12) => {
  const { data } = useQuery({
    queryKey: ["showcase-images", limit],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("images")
        .eq("is_published", true)
        .not("images", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      const real = (props ?? [])
        .flatMap((p) => p.images ?? [])
        .filter((url): url is string => typeof url === "string" && url.length > 0);

      return real.length > 0 ? real : FALLBACK_ROOM_IMAGES;
    },
  });

  return data ?? FALLBACK_ROOM_IMAGES;
};

export const FALLBACK_ROOM_IMAGE = FALLBACK_ROOM_IMAGES[0];
