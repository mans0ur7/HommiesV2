import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Home, X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/hooks/useFavorites";

interface PropertyOption {
  id: string;
  title: string;
  city: string;
  monthly_rent: number;
  images: string[] | null;
  size_sqm: number | null;
  room_count: number | null;
}

interface SharePropertyModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (propertyId: string) => void;
}

const SharePropertyModal = ({ open, onClose, onPick }: SharePropertyModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { favorites } = useFavorites();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Pull both the user's favorites and their own listings so a landlord can
  // share a unit they manage without having to favorite their own listing.
  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);

    const run = async () => {
      const ids = new Set<string>(favorites);
      const { data: own } = await supabase
        .from("properties")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_published", true);
      own?.forEach((r) => ids.add(r.id));

      if (ids.size === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("properties")
        .select("id, title, city, monthly_rent, images, size_sqm, room_count")
        .in("id", Array.from(ids))
        .eq("is_published", true);
      setProperties(data || []);
      setLoading(false);
    };
    run();
  }, [open, user, favorites]);

  const filtered = search.trim()
    ? properties.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.city.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Home className="w-4 h-4 text-primary" />
            {t("chat.shareProperty.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("chat.shareProperty.search")}
              className="pl-9 h-10 rounded-full"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {t("chat.shareProperty.empty")}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPick(p.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/70 transition-colors text-left"
                >
                  <img
                    src={p.images?.[0] || "/placeholder.svg"}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-muted"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.city}</p>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {p.monthly_rent.toLocaleString()} kr/md
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            {t("chat.shareProperty.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharePropertyModal;
