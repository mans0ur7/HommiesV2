import { useEffect, useState } from "react";
import { Home, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PropertyCardBubbleProps {
  propertyId: string;
  isOwn: boolean;
  onOpen: () => void;
}

interface CardData {
  id: string;
  title: string;
  city: string;
  monthly_rent: number;
  images: string[] | null;
  size_sqm: number | null;
  room_count: number | null;
}

const PropertyCardBubble = ({ propertyId, isOwn, onOpen }: PropertyCardBubbleProps) => {
  const [data, setData] = useState<CardData | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("properties")
      .select("id, title, city, monthly_rent, images, size_sqm, room_count")
      .eq("id", propertyId)
      .maybeSingle()
      .then(({ data: row }) => {
        if (cancelled) return;
        if (row) setData(row);
        else setMissing(true);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (missing) {
    return (
      <div
        className={`rounded-2xl px-3 py-2 text-xs ${
          isOwn ? "bg-primary/80 text-primary-foreground" : "bg-muted/60 text-muted-foreground"
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5" />
          Boligen findes ikke længere
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-[240px] rounded-2xl bg-muted/60 animate-pulse h-28" />
    );
  }

  return (
    <button
      onClick={onOpen}
      className={`group block w-[260px] rounded-2xl overflow-hidden text-left shadow-sm transition-transform hover:scale-[1.02] ${
        isOwn ? "bg-primary text-primary-foreground" : "bg-background border border-border/50"
      }`}
    >
      <div className="relative h-32 bg-muted">
        <img
          src={data.images?.[0] || "/placeholder.svg"}
          alt={data.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/95 text-foreground text-[10px] font-semibold shadow">
          <Home className="w-3 h-3" />
          Bolig
        </div>
      </div>
      <div className="p-3">
        <p className={`text-sm font-semibold truncate ${isOwn ? "text-primary-foreground" : "text-foreground"}`}>
          {data.title}
        </p>
        <p className={`text-xs truncate ${isOwn ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {data.city}
        </p>
        <div className={`mt-2 flex items-center justify-between text-xs font-medium ${isOwn ? "text-primary-foreground" : "text-foreground"}`}>
          <span>{data.monthly_rent.toLocaleString()} kr/md</span>
          <span className="inline-flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:gap-1.5 transition-all">
            Se bolig <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
};

export default PropertyCardBubble;
