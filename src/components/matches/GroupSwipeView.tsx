import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, Users, ArrowLeft, Home, Heart, MapPin, Send, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGroupSwipe, type SwipeProperty } from "@/hooks/useGroupSwipe";
import { useGroupRequests } from "@/hooks/useGroupRequests";
import MatchCard from "./MatchCard";
import EmptyState from "@/components/ui/empty-state";
import { toast } from "sonner";
import type { HousingGroup } from "@/hooks/useHousingGroups";

interface GroupSwipeViewProps {
  group: HousingGroup;
  onExit: () => void;
}

/**
 * Swipe sammen som gruppe. Hvert medlem swiper på boliger; en bolig alle har liket
 * bliver et gruppe-match, som gruppen kan kontakte udlejeren om sammen.
 */
const GroupSwipeView = ({ group, onExit }: GroupSwipeViewProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { memberCount, candidates, matches, loading, vote, likeCount } = useGroupSwipe(group.id);
  const { sendGroupRequest } = useGroupRequests();

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [showMatches, setShowMatches] = useState(false);
  const dragStart = useState({ x: 0 })[0];

  const top = candidates[0];
  const next = candidates[1];

  const act = (value: "like" | "skip") => {
    if (!top) return;
    setSwipeDir(value === "like" ? "right" : "left");
    setTimeout(() => {
      vote(top.id, value);
      setSwipeDir(null);
      setDragX(0);
    }, 220);
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > 100) act("like");
    else if (dragX < -100) act("skip");
    else setDragX(0);
  };

  const handleContact = async (p: SwipeProperty) => {
    const ok = await sendGroupRequest({
      group_id: group.id,
      property_id: p.id,
      landlord_id: p.user_id,
      desired_rooms: group.desired_rooms ?? undefined,
    });
    if (ok) {
      setRequested((prev) => new Set(prev).add(p.id));
      toast.success("Anmodning sendt til udlejeren — på vegne af hele gruppen 🫂");
    } else {
      toast.error("Kunne ikke sende anmodning");
    }
  };

  const memberAvatars = (group.members || []).filter((m) => m.status === "accepted").slice(0, 5);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Group bar */}
      <div className="flex items-center justify-between gap-3 mb-2 rounded-2xl border border-border/60 bg-card shadow-soft px-3 py-2">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Mig selv
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-secondary-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{group.name}</span>
          <div className="flex -space-x-2 ml-1">
            {memberAvatars.map((m) => (
              <div key={m.user_id} className="w-6 h-6 rounded-full border-2 border-card bg-muted overflow-hidden">
                {m.profile?.avatar_url ? (
                  <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] text-muted-foreground">
                    {(m.profile?.name ?? "?").charAt(0)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowMatches((s) => !s)}
          className={`relative inline-flex items-center gap-1.5 rounded-full px-3 h-8 text-xs font-medium transition-all ${
            showMatches ? "bg-foreground text-background" : "bg-secondary/20 text-foreground hover:bg-secondary/30"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${matches.length ? "fill-current" : ""}`} />
          Matches
          {matches.length > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
              {matches.length}
            </span>
          )}
        </button>
      </div>

      {showMatches ? (
        // ───────── JERES MATCHES ─────────
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Jeres fælles matches</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display text-foreground">
              Boliger I <span className="italic text-secondary-foreground/50">alle</span> har liket
            </h2>
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              tone="secondary"
              title="Ingen gruppe-matches endnu"
              description="Når alle i gruppen har liket den samme bolig, dukker den op her — så kan I kontakte udlejeren sammen."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {matches.map((p) => (
                <div key={p.id} className="rounded-2xl border border-border/60 bg-card shadow-soft overflow-hidden">
                  <button onClick={() => navigate(`/property/${p.id}`)} className="block w-full text-left">
                    <div className="aspect-[16/10] bg-muted overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-8 h-8 text-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">
                          {p.monthly_rent.toLocaleString("da-DK")} kr<span className="text-xs text-muted-foreground">/md</span>
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-secondary-foreground bg-secondary/30 rounded-full px-2 py-0.5">
                          <Heart className="w-3 h-3 fill-current" /> Alle enige
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-foreground truncate mt-1">{p.title}</h3>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{[p.address, p.city].filter(Boolean).join(", ")}</span>
                      </p>
                    </div>
                  </button>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => handleContact(p)}
                      disabled={requested.has(p.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 h-10 text-sm font-medium transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {requested.has(p.id) ? "Anmodning sendt" : "Kontakt udlejer sammen"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // ───────── SWIPE DECK ─────────
        <div className="flex-1 min-h-0 flex justify-center items-center">
          {loading ? (
            <div className="animate-pulse h-full max-h-[560px] aspect-[3/4]">
              <div className="w-full h-full bg-muted/40 rounded-3xl" />
            </div>
          ) : !top ? (
            <EmptyState
              icon={Heart}
              tone="secondary"
              title="I har set alle boliger"
              description={
                matches.length
                  ? "Tjek 'Matches' for de boliger I alle har liket — og kontakt udlejerne sammen."
                  : "Kom tilbage senere, eller udvid jeres kriterier. Nye boliger dukker op løbende."
              }
              actionLabel={matches.length ? "Se jeres matches" : undefined}
              onAction={matches.length ? () => setShowMatches(true) : undefined}
            />
          ) : (
            <div className="relative h-full flex items-center justify-center gap-4 md:gap-8">
              {!isMobile && (
                <button
                  onClick={() => act("skip")}
                  aria-label="Spring over"
                  className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-background border-2 border-border hover:border-destructive hover:text-destructive text-foreground/70 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
                >
                  <X className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={2.5} />
                </button>
              )}

              <div className="relative">
                {next && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 scale-95 opacity-50 pointer-events-none">
                    <MatchCard type="property" property={next as any} isBackground />
                  </div>
                )}

                <div
                  onTouchStart={isMobile ? (e) => { dragStart.x = e.touches[0].clientX; setIsDragging(true); } : undefined}
                  onTouchMove={isMobile ? (e) => { if (isDragging) setDragX(e.touches[0].clientX - dragStart.x); } : undefined}
                  onTouchEnd={isMobile ? onDragEnd : undefined}
                  style={
                    isMobile && (isDragging || dragX !== 0)
                      ? { transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`, transition: isDragging ? "none" : "transform 300ms ease-out" }
                      : undefined
                  }
                  className={`touch-pan-y ${
                    swipeDir === "left" ? "transition-all duration-300 -translate-x-[150%] rotate-[-15deg] opacity-0"
                    : swipeDir === "right" ? "transition-all duration-300 translate-x-[150%] rotate-[15deg] opacity-0"
                    : ""
                  }`}
                >
                  {/* "X/Y enige" progress chip */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-xs font-medium px-3 py-1">
                      <Users className="w-3.5 h-3.5 text-secondary" />
                      {likeCount(top.id)}/{memberCount} enige
                    </span>
                  </div>

                  {isMobile && isDragging && (
                    <>
                      <div className="absolute top-6 left-6 z-20 px-4 py-2 rounded-xl border-4 border-destructive text-destructive font-bold text-2xl rotate-[-15deg] pointer-events-none" style={{ opacity: Math.min(Math.max(-dragX / 100, 0), 1) }}>
                        NEJ
                      </div>
                      <div className="absolute top-6 right-6 z-20 px-4 py-2 rounded-xl border-4 border-primary text-primary font-bold text-2xl rotate-[15deg] pointer-events-none" style={{ opacity: Math.min(Math.max(dragX / 100, 0), 1) }}>
                        JA
                      </div>
                    </>
                  )}

                  <MatchCard type="property" property={top as any} onClick={() => navigate(`/property/${top.id}`)} />
                </div>
              </div>

              {!isMobile && (
                <button
                  onClick={() => act("like")}
                  aria-label="Synes om"
                  className="shrink-0 w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95"
                >
                  <Check className="w-6 h-6 lg:w-7 lg:h-7" strokeWidth={3} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GroupSwipeView;
