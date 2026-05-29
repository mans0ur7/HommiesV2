import { useState, useEffect, useRef, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, ArrowRight, MapPin, MapPinned } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDawaAutocomplete } from "@/hooks/useDawaAutocomplete";
import { useShowcaseImages } from "@/hooks/useShowcaseImages";

const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [city, setCity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { results: dawaResults, loading: dawaLoading } = useDawaAutocomplete(city);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const goToExplore = (q: string) => {
    navigate(`/explore${q ? `?city=${encodeURIComponent(q)}` : ""}`);
  };

  const { data: bentoImages } = useQuery({
    queryKey: ["hero-bento-properties"],
    staleTime: 1000 * 60 * 10,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, title, monthly_rent, images, city")
        .eq("is_published", true)
        .order("rating_average", { ascending: false, nullsFirst: false })
        .limit(3);
      return (data ?? []).filter((p) => p.images && p.images.length > 0);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    goToExplore(city);
  };

  const placeholder = t("landing.heroSearchPlaceholder");

  const fallbackImages = useShowcaseImages(6);
  const big = bentoImages?.[0];
  const small1 = bentoImages?.[1];
  const small2 = bentoImages?.[2];
  const bigImg = big?.images?.[0] ?? fallbackImages[0];
  const small1Img = small1?.images?.[0] ?? fallbackImages[1];
  const small2Img = small2?.images?.[0] ?? fallbackImages[2];

  return (
    <section className="relative bg-background pt-6 pb-12 sm:pt-10 sm:pb-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          {/* LEFT — copy + search */}
          <div>
            <h1 className="font-semibold tracking-[-0.03em] text-foreground leading-[1.02] text-[clamp(2.4rem,5.5vw,4.25rem)]">
              {t("landing.heroLine1")}
              <br />
              <span className="text-foreground/50">{t("landing.heroLine2")}</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
              {t("landing.heroSubtitle")}
            </p>

            {/* Search panel */}
            <div ref={wrapperRef} className="relative mt-8">
              <div className="bg-card border border-border rounded-2xl shadow-[0_8px_30px_-12px_rgba(3,42,59,0.15)] overflow-hidden">
                <form onSubmit={handleSubmit} className="flex items-stretch p-2 gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 min-w-0">
                    <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder={placeholder}
                      className="w-full bg-transparent outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base placeholder:text-muted-foreground/70 py-3"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground rounded-xl px-5 sm:px-7 py-3 font-medium text-sm sm:text-base inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    {t("landing.heroSearch")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {showSuggestions && city.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50">
                  {dawaResults.length > 0 ? (
                    <ul className="py-2 max-h-80 overflow-y-auto">
                      {dawaResults.map((r, i) => {
                        const isArea = r.type === "postnummer" || r.type === "vejnavn";
                        const Icon = isArea ? MapPinned : MapPin;
                        return (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() => {
                                const filterValue = r.city || r.label;
                                setCity(r.label);
                                setShowSuggestions(false);
                                goToExplore(filterValue);
                              }}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                            >
                              <Icon className={`w-5 h-5 flex-shrink-0 ${isArea ? "text-secondary" : "text-muted-foreground"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{r.label}</p>
                                {r.sublabel && <p className="text-xs text-muted-foreground truncate">{r.sublabel}</p>}
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="py-6 px-4 text-center">
                      <p className="text-sm text-muted-foreground">{dawaLoading ? t("landing.heroSearching") : t("landing.heroNoResults", { query: city })}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick shortcuts */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>{t("landing.heroPopular")}</span>
              {["København", "Aarhus", "Odense", "Aalborg"].map((c) => (
                <button
                  key={c}
                  onClick={() => navigate(`/explore?city=${encodeURIComponent(c)}`)}
                  className="text-foreground/70 hover:text-foreground underline-offset-4 hover:underline"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — bento */}
          <div className="hidden lg:grid grid-cols-5 grid-rows-6 gap-3 h-[500px]">
            <BentoCard
              className="col-span-3 row-span-6"
              image={bigImg}
              title={big?.title}
              price={big?.monthly_rent}
              onClick={() => big && navigate(`/property/${big.id}`)}
            />
            <BentoCard
              className="col-span-2 row-span-3"
              image={small1Img}
              title={small1?.title}
              price={small1?.monthly_rent}
              onClick={() => small1 && navigate(`/property/${small1.id}`)}
            />
            <BentoCard
              className="col-span-2 row-span-3"
              image={small2Img}
              title={small2?.title}
              price={small2?.monthly_rent}
              onClick={() => small2 && navigate(`/property/${small2.id}`)}
            />
          </div>

          {/* Mobile bento — single hero image */}
          <div className="lg:hidden grid grid-cols-3 gap-2 h-64">
            <BentoCard
              className="col-span-2 row-span-2"
              image={bigImg}
              title={big?.title}
              price={big?.monthly_rent}
              onClick={() => big && navigate(`/property/${big.id}`)}
            />
            <BentoCard
              image={small1Img}
              onClick={() => small1 && navigate(`/property/${small1.id}`)}
            />
            <BentoCard
              image={small2Img}
              onClick={() => small2 && navigate(`/property/${small2.id}`)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

interface BentoCardProps {
  className?: string;
  image?: string;
  title?: string;
  price?: number;
  onClick?: () => void;
}

const BentoCard = ({ className = "", image, title, price, onClick }: BentoCardProps) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl bg-muted ${className}`}
    >
      {image ? (
        <img
          src={image}
          alt={title ?? t("landing.heroRoomAlt")}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60" />
      )}
      {price && (
        <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 shadow-sm">
          <span className="text-xs font-semibold text-foreground">
            {t("landing.heroPriceFrom", { price: price.toLocaleString("da-DK") })}
          </span>
        </div>
      )}
    </button>
  );
};

export default HeroSection;
