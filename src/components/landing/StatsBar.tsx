import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const StatsBar = () => {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ["landing-stats"],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const [propsRes, citiesRes, profilesRes] = await Promise.all([
        supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true),
        supabase
          .from("properties")
          .select("city")
          .eq("is_published", true),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);

      const cities = new Set((citiesRes.data ?? []).map((r) => r.city).filter(Boolean));
      return {
        properties: propsRes.count ?? 0,
        cities: cities.size,
        users: profilesRes.count ?? 0,
      };
    },
  });

  // Hide the whole stats bar until we have a meaningful number of listings.
  // Once there are 50+ active listings, the numbers look impressive instead of sparse.
  if (!data || (data.properties ?? 0) < 50) return null;

  const stats = [
    { value: data.properties, label: t("landing.statsRooms"), suffix: "+" },
    { value: data.cities, label: t("landing.statsCities"), suffix: "" },
    { value: data.users, label: t("landing.statsUsers"), suffix: "+" },
  ];

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-3 gap-y-6 gap-x-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                i > 0 ? "md:border-l md:border-border md:pl-6" : ""
              }`}
            >
              <span className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight tabular-nums">
                {stat.prefix}
                {typeof stat.value === "number" ? stat.value.toLocaleString("da-DK") : stat.value}
                {stat.suffix}
              </span>
              <span className="mt-1 text-xs sm:text-sm text-muted-foreground leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
