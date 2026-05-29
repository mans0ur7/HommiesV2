import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpRight, MapPin, Home as HomeIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProperty {
  id: string;
  title: string;
  city: string;
  monthly_rent: number;
  images: string[] | null;
  size_sqm: number | null;
  room_count: number | null;
}

const FeaturedRoomsSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["landing-featured-rooms"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, title, city, monthly_rent, images, size_sqm, room_count")
        .eq("is_published", true)
        .order("rating_average", { ascending: false, nullsFirst: false })
        .limit(7);
      return (data ?? []) as FeaturedProperty[];
    },
  });

  if (!isLoading && properties.length === 0) return null;

  const hero = properties[0];
  const stack = properties.slice(1, 3);
  const strip = properties.slice(3, 7);

  return (
    <section className="bg-background py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
              {t("landing.featuredTitle")}
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              {t("landing.featuredSubtitle")}
            </p>
          </div>
          <button
            onClick={() => navigate("/explore")}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {t("landing.seeAllRooms")}
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 h-[520px]">
            <div className="rounded-2xl bg-muted animate-pulse" />
            <div className="grid grid-rows-2 gap-4">
              <div className="rounded-2xl bg-muted animate-pulse" />
              <div className="rounded-2xl bg-muted animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {/* Asymmetric bento */}
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 lg:h-[540px]">
              {hero && <FeatureCard property={hero} variant="hero" />}
              <div className="grid sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4">
                {stack.map((p) => (
                  <FeatureCard key={p.id} property={p} variant="small" />
                ))}
              </div>
            </div>

            {/* Strip below */}
            {strip.length > 0 && (
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {strip.map((p) => (
                  <FeatureCard key={p.id} property={p} variant="strip" />
                ))}
              </div>
            )}
          </>
        )}

        <button
          onClick={() => navigate("/explore")}
          className="sm:hidden mt-6 w-full inline-flex items-center justify-center gap-1 text-sm font-medium text-foreground border border-border rounded-xl py-3"
        >
          {t("landing.seeAllRooms")}
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

const FeatureCard = ({
  property,
  variant,
}: {
  property: FeaturedProperty;
  variant: "hero" | "small" | "strip";
}) => {
  const navigate = useNavigate();
  const aspect =
    variant === "hero" ? "aspect-[4/3] lg:aspect-auto lg:h-full" : variant === "small" ? "aspect-[5/4] lg:aspect-auto lg:h-full" : "aspect-[4/3]";

  return (
    <button
      onClick={() => navigate(`/property/${property.id}`)}
      className="group text-left flex flex-col"
    >
      <div className={`relative overflow-hidden rounded-2xl bg-muted ${aspect}`}>
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <HomeIcon className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium text-foreground truncate ${variant === "hero" ? "text-base sm:text-lg" : "text-sm"}`}>
            {property.title}
          </h3>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{property.city}</span>
            {property.size_sqm && (
              <>
                <span>·</span>
                <span>{property.size_sqm} m²</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-semibold text-foreground ${variant === "hero" ? "text-base" : "text-sm"}`}>
            {property.monthly_rent.toLocaleString("da-DK")} kr
          </div>
          <div className="text-[10px] text-muted-foreground">/md</div>
        </div>
      </div>
    </button>
  );
};

export default FeaturedRoomsSection;
