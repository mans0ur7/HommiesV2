import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import {
  ArrowLeft, Heart, X, Eye, Home, MapPin, Send, Sparkles, Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useGroupSwipe, type SwipeProperty } from "@/hooks/useGroupSwipe";
import { useGroupRequests } from "@/hooks/useGroupRequests";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { toast } from "sonner";
import type { HousingGroup } from "@/hooks/useHousingGroups";

interface GroupSwipeViewProps {
  group: HousingGroup;
  onExit: () => void;
}

interface MemberInfo {
  user_id: string;
  name: string;
  avatar_url: string | null;
}

const SWIPE_THRESHOLD = 100;

const MemberAvatar = ({
  m, size = "w-6 h-6", ring = "", dim = false,
}: { m: MemberInfo; size?: string; ring?: string; dim?: boolean }) => (
  <div className={`${size} rounded-full overflow-hidden bg-white/15 flex items-center justify-center shrink-0 ${ring} ${dim ? "opacity-60" : ""}`}>
    {m.avatar_url ? (
      <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
    ) : (
      <span className="text-[10px] font-medium text-white/80">{m.name.charAt(0)}</span>
    )}
  </div>
);

/**
 * "Teateret": gruppe-swipe som en mørk, immersiv scene. Boligen er hovedrollen,
 * gruppens live-stemmer ligger direkte på kortet (avatarer + enigheds-meter),
 * og et fuldt gruppe-match fejres med konfetti. Matches vises som et lyst,
 * editorial galleri med fælles kontakt-CTA.
 */
const GroupSwipeView = ({ group, onExit }: GroupSwipeViewProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { memberIds, memberCount, votes, candidates, matches, loading, vote, likeCount } =
    useGroupSwipe(group);
  const { sentRequests, sendGroupRequest } = useGroupRequests();

  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showMatches, setShowMatches] = useState(false);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [celebration, setCelebration] = useState<SwipeProperty | null>(null);
  const [hasUnseenMatch, setHasUnseenMatch] = useState(false);
  const [hintVisible, setHintVisible] = useState(true);

  const dragStartXRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const thresholdSideRef = useRef<"left" | "right" | null>(null);
  const isDraggingRef = useRef(false);
  const pendingCelebrationRef = useRef<SwipeProperty | null>(null);
  // null indtil første ikke-loading snapshot: eksisterende matches må ikke
  // udløse konfetti ved mount — kun NYE matches fejres.
  const seenMatchIdsRef = useRef<Set<string> | null>(null);

  const top = candidates[0];
  const next = candidates[1];

  const members: MemberInfo[] = memberIds.map((id) => {
    const m = (group.members || []).find((x) => x.user_id === id);
    return { user_id: id, name: m?.profile?.name ?? "?", avatar_url: m?.profile?.avatar_url ?? null };
  });
  const voteOf = (propertyId: string, userId: string) =>
    votes.find((v) => v.property_id === propertyId && v.user_id === userId)?.vote;

  const alreadyRequested = (propertyId: string) =>
    requested.has(propertyId) ||
    sentRequests.some((r) => r.group_id === group.id && r.property_id === propertyId);

  useEffect(() => { hapticLight(); }, []);
  useEffect(() => { setPhotoIdx(0); }, [top?.id]);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 4000);
    return () => clearTimeout(t);
  }, []);
  // Preload næste kortbillede, så swipe aldrig afslører et halvindlæst foto.
  useEffect(() => {
    if (next?.images?.[0]) {
      const img = new Image();
      img.src = next.images[0];
    }
  }, [next?.id, next?.images]);

  // Autoritativ fejring: nye matches fra realtime (en ven fuldendte et match,
  // mens du kiggede på noget andet). Udskydes hvis brugeren er midt i et træk.
  useEffect(() => {
    if (loading) return;
    if (!seenMatchIdsRef.current) {
      seenMatchIdsRef.current = new Set(matches.map((m) => m.id));
      return;
    }
    for (const m of matches) {
      if (seenMatchIdsRef.current.has(m.id)) continue;
      seenMatchIdsRef.current.add(m.id);
      if (isDraggingRef.current) pendingCelebrationRef.current = m;
      else setCelebration(m);
    }
  }, [matches, loading]);

  // Konfetti + haptik når fejringen åbner (respekterer reduced motion).
  useEffect(() => {
    if (!celebration) return;
    hapticSuccess();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const end = Date.now() + 1500;
    const colors = ["#FCC9BA", "#1a3d4d", "#a7d2b6", "#fffaf3"];
    const tick = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
      if (Date.now() < end) requestAnimationFrame(tick);
    };
    tick();
  }, [celebration]);

  // Desktop: piletaster swiper.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showMatches || celebration || !top) return;
      if (e.key === "ArrowLeft") act("skip");
      else if (e.key === "ArrowRight") act("like");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const act = (value: "like" | "skip") => {
    if (!top || swipeDir) return; // dobbelt-klik-værn under exit-animationen
    if (value === "like") hapticSuccess(); else hapticLight();
    const prop = top;
    // Optimistisk fejring: alle andre har liket, og mit like fuldender matchet.
    const willMatch = value === "like" && memberCount > 1 && likeCount(prop.id) === memberCount - 1;
    setSwipeDir(value === "like" ? "right" : "left");
    setTimeout(() => {
      vote(prop.id, value);
      setSwipeDir(null);
      setDragX(0);
      if (willMatch && !seenMatchIdsRef.current?.has(prop.id)) {
        seenMatchIdsRef.current?.add(prop.id);
        setCelebration(prop);
      }
    }, 250);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragStartXRef.current = e.touches[0].clientX;
    dragDistanceRef.current = 0;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - dragStartXRef.current;
    dragDistanceRef.current = Math.max(dragDistanceRef.current, Math.abs(dx));
    setDragX(dx);
    const side = dx > SWIPE_THRESHOLD ? "right" : dx < -SWIPE_THRESHOLD ? "left" : null;
    if (side && thresholdSideRef.current !== side) hapticLight();
    thresholdSideRef.current = side;
  };
  const onTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    thresholdSideRef.current = null;
    if (dragX > SWIPE_THRESHOLD) act("like");
    else if (dragX < -SWIPE_THRESHOLD) act("skip");
    else setDragX(0);
    if (pendingCelebrationRef.current) {
      const p = pendingCelebrationRef.current;
      pendingCelebrationRef.current = null;
      setCelebration(p);
    }
  };

  // Klik må ikke udløses af et træk (foto-zoner + detalje-panel).
  const tapGuard = () => dragDistanceRef.current < 8;

  const handleContact = async (p: SwipeProperty) => {
    if (alreadyRequested(p.id)) return;
    setRequested((prev) => new Set(prev).add(p.id)); // optimistisk lås mod dobbelt-tryk
    const ok = await sendGroupRequest({
      group_id: group.id,
      property_id: p.id,
      landlord_id: p.user_id,
      desired_rooms: group.desired_rooms ?? undefined,
    });
    if (ok) {
      toast.success("Anmodning sendt til udlejeren på vegne af hele gruppen");
    } else {
      setRequested((prev) => {
        const n = new Set(prev);
        n.delete(p.id);
        return n;
      });
      toast.error("Kunne ikke sende anmodningen — prøv igen");
    }
  };

  const openMatches = () => {
    setShowMatches(true);
    setHasUnseenMatch(false);
  };

  const dismissCelebration = () => {
    setCelebration(null);
    setHasUnseenMatch(true);
  };

  const fmtRent = (n: number) => n.toLocaleString("da-DK");
  const photos = top?.images?.length ? top.images : [];
  const topLikes = top ? likeCount(top.id) : 0;
  const myVoteMissing = top && user ? !voteOf(top.id, user.id) : false;

  // ───────────────────────── MODE B: JERES MATCHES ─────────────────────────
  if (showMatches) {
    const metaParts = [
      `${memberCount} ${memberCount === 1 ? "medlem" : "medlemmer"}`,
      group.city || null,
      group.budget_per_person ? `maks ${fmtRent(group.budget_per_person)} kr./person` : null,
      group.desired_rooms ? `${group.desired_rooms} vær.` : null,
    ].filter(Boolean);

    return (
      <div className="flex flex-col h-full min-h-0 animate-fade-in">
        <div className="shrink-0 flex items-center justify-between gap-3 pb-3">
          <button
            onClick={() => setShowMatches(false)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 h-9 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Til swipe
          </button>
          <button
            onClick={onExit}
            className="text-xs font-medium text-foreground/60 hover:text-foreground transition-colors px-2 h-9"
          >
            Mig selv
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-foreground/40" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-foreground/60">Jeres fælles matches</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display text-foreground">
              Boliger I <span className="italic text-secondary-foreground/50">alle</span> har liket
            </h2>
            {metaParts.length > 0 && (
              <p className="mt-1 text-[11px] text-foreground/60">{metaParts.join(" · ")}</p>
            )}
          </div>

          {matches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              tone="secondary"
              title="Ingen gruppe-matches endnu"
              description="Når alle i gruppen har liket den samme bolig, dukker den op her — så kan I kontakte udlejeren sammen."
            />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {matches.map((p, i) => {
                const sent = alreadyRequested(p.id);
                const feature = i === 0;
                return (
                  <div
                    key={p.id}
                    className={`${feature ? "col-span-2" : ""} rounded-2xl border border-border/60 bg-card shadow-soft hover-lift overflow-hidden opacity-0 animate-fade-in-up`}
                    style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                  >
                    <button onClick={() => navigate(`/property/${p.id}`)} className="relative block w-full text-left">
                      <div className={`${feature ? "aspect-[16/9]" : "aspect-[4/3]"} bg-muted overflow-hidden`}>
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-8 h-8 text-foreground/30" />
                          </div>
                        )}
                      </div>
                      <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 bg-secondary/90 backdrop-blur rounded-full pl-1.5 pr-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                        <span className="flex -space-x-1.5">
                          {members.slice(0, 3).map((m) => (
                            <MemberAvatar key={m.user_id} m={m} size="w-4 h-4" />
                          ))}
                        </span>
                        Alle enige
                      </span>
                      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
                      <p className={`absolute bottom-2 left-3 font-display text-white ${feature ? "text-2xl" : "text-lg"}`}>
                        {fmtRent(p.monthly_rent)} kr.<span className="font-sans text-xs text-white/70">/md</span>
                      </p>
                    </button>
                    <div className="p-3 space-y-2.5">
                      <div>
                        <h3 className="text-sm font-medium text-foreground truncate">{p.title}</h3>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{[p.address, p.city].filter(Boolean).join(", ")}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => handleContact(p)}
                        disabled={sent}
                        className={`w-full inline-flex items-center justify-center gap-1.5 rounded-full h-10 text-sm font-medium transition-colors ${
                          sent
                            ? "bg-secondary/40 text-foreground cursor-default"
                            : "bg-foreground text-background hover:bg-foreground/90"
                        }`}
                      >
                        {sent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                        {sent ? "Anmodning sendt" : "Kontakt udlejer sammen"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ───────────────────────── MODE A: SCENEN (DECK) ─────────────────────────
  return (
    <div className="flex flex-col h-full min-h-0 -mx-4 md:mx-0">
      <section className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-primary md:rounded-3xl md:shadow-soft-lg animate-scale-in">
        {/* Ambiente lys-blobs */}
        <div aria-hidden className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-secondary/20 blur-3xl pointer-events-none" />
        <div aria-hidden className="absolute -bottom-32 -left-24 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        {/* Topbar */}
        <div className="relative z-30 shrink-0 h-14 px-3 flex items-center justify-between gap-2">
          <button
            onClick={() => { hapticLight(); onExit(); }}
            aria-label="Tilbage til mig selv"
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0 bg-white/10 backdrop-blur rounded-full pl-1.5 pr-3.5 py-1.5">
            <div className="flex -space-x-2">
              {members.slice(0, 3).map((m) => (
                <div key={m.user_id} className="ring-2 ring-primary rounded-full">
                  <MemberAvatar m={m} size="w-7 h-7" />
                </div>
              ))}
              {members.length > 3 && (
                <span className="w-7 h-7 rounded-full bg-white/20 ring-2 ring-primary text-[10px] font-semibold text-white flex items-center justify-center">
                  +{members.length - 3}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-white truncate">{group.name}</span>
          </div>

          <button
            onClick={openMatches}
            aria-label={`Se jeres matches${matches.length ? ` (${matches.length})` : ""}`}
            className="relative w-10 h-10 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Heart className={`w-5 h-5 ${matches.length ? "fill-current text-secondary" : ""}`} />
            {matches.length > 0 && (
              <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center ${hasUnseenMatch ? "animate-notification-pulse" : ""}`}>
                {matches.length}
              </span>
            )}
          </button>
        </div>

        {/* Hint */}
        {hintVisible && top && (
          <div className="absolute top-14 inset-x-0 z-20 flex justify-center pointer-events-none">
            <span className="bg-black/45 backdrop-blur-md text-white/90 text-[11px] rounded-full px-3.5 py-1.5 animate-fade-in-up">
              Boliger I alle liker, bliver jeres fælles matches ✨
            </span>
          </div>
        )}

        {loading ? (
          // Skeleton — kun ved allerførste load (hook'en gater refetches).
          <>
            <div className="relative flex-1 min-h-0 z-10">
              <div className="absolute inset-x-3 top-0 bottom-2 md:inset-x-auto md:w-[400px] md:left-1/2 md:-translate-x-1/2">
                <div className="absolute inset-0 rounded-[1.75rem] bg-white/5 animate-pulse" />
              </div>
            </div>
            <div className="relative z-30 shrink-0 flex items-center justify-center gap-5 pb-4 pt-2">
              <span className="w-14 h-14 rounded-full bg-white/5" />
              <span className="w-11 h-11 rounded-full bg-white/5" />
              <span className="w-[68px] h-[68px] rounded-full bg-white/5" />
            </div>
          </>
        ) : !top ? (
          // Tomt dæk: vis hvem gruppen venter på.
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center px-6 py-8">
            <div className="w-20 h-20 rounded-3xl bg-white/10 ring-1 ring-white/15 flex items-center justify-center animate-scale-in mb-5">
              <Sparkles className="w-9 h-9 text-secondary" />
            </div>
            <h2 className="font-display text-3xl text-white">I har set det hele</h2>
            <p className="mt-2 text-sm text-white/70 max-w-[300px]">
              {matches.length
                ? `I har ${matches.length} ${matches.length === 1 ? "fælles match" : "fælles matches"} — kontakt udlejerne sammen, mens boligerne er ledige.`
                : "Nye boliger dukker op løbende. Kig forbi igen, eller udvid jeres kriterier."}
            </p>
            {members.length > 0 && (() => {
              const counts = members.map((m) => ({
                m,
                count: votes.filter((v) => v.user_id === m.user_id).length,
              }));
              const maxCount = Math.max(...counts.map((c) => c.count), 1);
              return (
                <div className="mt-5 w-full max-w-[280px] space-y-2.5">
                  {counts.map(({ m, count }) => (
                    <div key={m.user_id} className="flex items-center gap-2.5">
                      <MemberAvatar m={m} size="w-7 h-7" />
                      <span className="flex-1 min-w-0 text-left text-xs text-white truncate">
                        {m.user_id === user?.id ? "Dig" : m.name}
                      </span>
                      <span className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-secondary transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </span>
                      <span className="w-6 text-right text-[11px] tabular-nums text-white/60">{count}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="mt-6 flex flex-col gap-2 w-full max-w-[280px]">
              {matches.length > 0 && (
                <Button onClick={openMatches} className="rounded-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  Se jeres matches ({matches.length})
                </Button>
              )}
              <Button onClick={onExit} variant="ghost" className="rounded-full h-11 text-white hover:bg-white/10 hover:text-white">
                Tilbage til mig selv
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Dæk */}
            <div className="relative flex-1 min-h-0 z-10">
              <div className="absolute inset-x-3 top-0 bottom-2 md:inset-x-auto md:w-[400px] md:left-1/2 md:-translate-x-1/2">
                {/* Næste kort bagved */}
                {next && (
                  <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden scale-[0.94] translate-y-3 opacity-50 pointer-events-none bg-primary ring-1 ring-white/10">
                    {next.images?.[0] ? (
                      <img src={next.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                  </div>
                )}

                {/* Øverste kort */}
                <div
                  key={top.id}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  style={
                    (isDragging || dragX !== 0) && !swipeDir
                      ? {
                          transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                          transition: isDragging ? "none" : "transform 300ms ease-out",
                        }
                      : undefined
                  }
                  className={`absolute inset-0 touch-pan-y ${
                    swipeDir === "left"
                      ? "transition-all duration-300 -translate-x-[150%] rotate-[-15deg] opacity-0"
                      : swipeDir === "right"
                        ? "transition-all duration-300 translate-x-[150%] rotate-[15deg] opacity-0"
                        : ""
                  }`}
                >
                  <div className="absolute inset-0 rounded-[1.75rem] overflow-hidden ring-1 ring-white/10 bg-primary">
                    {/* Foto */}
                    {photos[photoIdx] ? (
                      <img src={photos[photoIdx]} alt={top.title} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                        <Home className="w-16 h-16 text-white/25" />
                      </div>
                    )}
                    <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/50 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    {/* Foto-indikatorer */}
                    {photos.length > 1 && (
                      <div className="absolute top-2.5 inset-x-3 flex gap-1.5">
                        {photos.map((_, i) => (
                          <span key={i} className={`h-1 flex-1 rounded-full ${i === photoIdx ? "bg-white/90" : "bg-white/30"}`} />
                        ))}
                      </div>
                    )}

                    {/* Foto-tap-zoner (øverste 60 %) */}
                    {photos.length > 1 && (
                      <>
                        <button
                          aria-label="Forrige billede"
                          onClick={() => { if (tapGuard()) setPhotoIdx((i) => (i === 0 ? photos.length - 1 : i - 1)); }}
                          className="absolute left-0 top-0 w-1/3 h-[60%]"
                        />
                        <button
                          aria-label="Næste billede"
                          onClick={() => { if (tapGuard()) setPhotoIdx((i) => (i === photos.length - 1 ? 0 : i + 1)); }}
                          className="absolute right-0 top-0 w-1/3 h-[60%]"
                        />
                      </>
                    )}

                    {/* Pris */}
                    <span className="absolute top-5 right-3 bg-secondary/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold text-secondary-foreground">
                      {fmtRent(top.monthly_rent)} kr/md
                    </span>

                    {/* Træk-farvetone + stempler */}
                    <div
                      className="absolute inset-0 bg-gradient-to-l from-secondary/40 to-transparent pointer-events-none"
                      style={{ opacity: Math.min(Math.max(dragX / 150, 0), 1) }}
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent pointer-events-none"
                      style={{ opacity: Math.min(Math.max(-dragX / 150, 0), 1) }}
                    />
                    <span
                      className="absolute top-16 right-5 rotate-[12deg] rounded-full border border-secondary/60 bg-black/35 backdrop-blur px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.15em] text-secondary pointer-events-none"
                      style={{ opacity: Math.min(Math.max(dragX / SWIPE_THRESHOLD, 0), 1) }}
                    >
                      Ja tak
                    </span>
                    <span
                      className="absolute top-16 left-5 rotate-[-12deg] rounded-full border border-white/50 bg-black/35 backdrop-blur px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.15em] text-white/90 pointer-events-none"
                      style={{ opacity: Math.min(Math.max(-dragX / SWIPE_THRESHOLD, 0), 1) }}
                    >
                      Nej tak
                    </span>

                    {/* Info-panel */}
                    <button
                      onClick={() => { if (tapGuard()) navigate(`/property/${top.id}`); }}
                      className="absolute bottom-0 inset-x-0 text-left px-4 pb-4 pt-8"
                    >
                      <h3 className="font-display text-2xl sm:text-3xl text-white leading-tight line-clamp-2">{top.title}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{[top.address, top.city].filter(Boolean).join(", ")}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {top.room_count != null && (
                          <span className="bg-white/12 backdrop-blur rounded-full px-2.5 py-1 text-xs text-white">{top.room_count} vær.</span>
                        )}
                        {top.size_sqm != null && (
                          <span className="bg-white/12 backdrop-blur rounded-full px-2.5 py-1 text-xs text-white">{top.size_sqm} m²</span>
                        )}
                      </div>

                      {/* Live enighed */}
                      {memberCount > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-3">
                          <div className="flex -space-x-2 shrink-0">
                            {members.slice(0, 5).map((m) => {
                              const v = voteOf(top.id, m.user_id);
                              return (
                                <div key={m.user_id} className="relative">
                                  <MemberAvatar
                                    m={m}
                                    ring={v === "like" ? "ring-2 ring-secondary" : v === "skip" ? "ring-2 ring-white/20" : "ring-2 ring-white/30"}
                                    dim={v === "skip"}
                                  />
                                  {v === "like" && (
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-secondary flex items-center justify-center animate-scale-in">
                                      <Heart className="w-2 h-2 fill-current text-secondary-foreground" />
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-1">
                              {Array.from({ length: memberCount }, (_, i) => (
                                <span
                                  key={i}
                                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i < topLikes ? "bg-secondary" : "bg-white/20"}`}
                                />
                              ))}
                            </div>
                            <p className={`mt-1.5 text-xs ${topLikes === memberCount - 1 && myVoteMissing && memberCount > 1 ? "text-secondary font-semibold animate-notification-pulse" : "text-white/80"}`}>
                              {topLikes === 0
                                ? "Ingen har stemt endnu"
                                : topLikes === memberCount - 1 && myVoteMissing && memberCount > 1
                                  ? "Kun dit like mangler!"
                                  : `${topLikes} af ${memberCount} har liket`}
                            </p>
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Kontrol-dok */}
            <div className="relative z-30 shrink-0 pb-4 pt-2">
              <p className="text-center text-[11px] text-white/45 mb-2">
                {candidates.length === 1 ? "1 bolig tilbage" : `${candidates.length} boliger tilbage`}
              </p>
              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={() => act("skip")}
                  aria-label="Spring over"
                  className="w-14 h-14 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white hover:border-destructive hover:text-destructive flex items-center justify-center transition-all active:scale-90"
                >
                  <X className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => navigate(`/property/${top.id}`)}
                  aria-label="Se detaljer"
                  className="w-11 h-11 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-90"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => act("like")}
                  aria-label="Synes om"
                  className="w-[68px] h-[68px] rounded-full bg-secondary text-secondary-foreground shadow-[0_8px_30px_-6px_hsl(6_100%_70%/0.55)] flex items-center justify-center transition-all active:scale-90"
                  style={{ transform: `scale(${1 + Math.min(Math.max(dragX, 0), 120) / 600})` }}
                >
                  <Heart className="w-7 h-7 fill-current" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Gruppe-match-fejring */}
      {celebration && (
        <div role="dialog" aria-label="Gruppe-match" className="fixed inset-0 z-[100]">
          {celebration.images?.[0] && (
            <img src={celebration.images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/70 to-primary/90" />
          <button
            onClick={dismissCelebration}
            aria-label="Luk"
            className="absolute top-[calc(var(--safe-top)+1rem)] right-4 z-10 p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative h-full flex flex-col items-center justify-center text-center px-8 max-w-md mx-auto">
            <span className="text-[11px] uppercase tracking-[0.3em] text-secondary font-semibold mb-3">Gruppe-match</span>
            <h1 className="font-display text-4xl md:text-5xl text-white animate-scale-in">I er alle enige!</h1>
            <p className="mt-2 text-white/80 text-sm">Alle i {group.name} har liket denne bolig</p>

            <div className="mt-6 flex -space-x-3">
              {members.slice(0, 5).map((m, i) => (
                <div key={m.user_id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${i * 90}ms` }}>
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/50 bg-white/15 flex items-center justify-center">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-medium text-white/80">{m.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 w-full rounded-2xl bg-white/10 border border-white/20 backdrop-blur p-3 flex items-center gap-3 text-left">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 shrink-0">
                {celebration.images?.[0] ? (
                  <img src={celebration.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Home className="w-6 h-6 text-white/40" /></div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white line-clamp-1">{celebration.title}</p>
                <p className="text-xs text-white/70">{fmtRent(celebration.monthly_rent)} kr/md</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 w-full">
              <Button
                onClick={() => { handleContact(celebration); dismissCelebration(); }}
                disabled={alreadyRequested(celebration.id)}
                className="rounded-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
              >
                <Send className="w-4 h-4 mr-2" />
                {alreadyRequested(celebration.id) ? "Anmodning sendt" : "Kontakt udlejer sammen"}
              </Button>
              <Button onClick={dismissCelebration} variant="ghost" className="rounded-full h-12 text-white hover:bg-white/10 hover:text-white">
                Swipe videre
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupSwipeView;
