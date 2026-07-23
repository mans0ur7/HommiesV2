import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "hommies_coach_tour_seen_v1";

interface TourStep {
  /** data-tour-id på elementet boblen peger på; null = centreret boble uden spotlight. */
  target: string | null;
  /** Rute steppet hører til — turen navigerer selv derhen. */
  path?: string;
  title: string;
  body: string;
  /** Begræns til bestemte roller (udeladt = alle). */
  roles?: Array<"roomie" | "landlord">;
}

const STEPS: TourStep[] = [
  {
    target: null,
    path: "/",
    title: "Velkommen til Hommies 👋",
    body: "Vil du have en hurtig rundtur? Vi peger på de vigtigste funktioner — det tager under et minut.",
  },
  {
    target: "nav-explore",
    path: "/",
    title: "Udforsk",
    body: "Her ligger alle boliger og roomies. Søg på by, brug filtre — og find præcis det, du leder efter.",
  },
  {
    target: "explore-map",
    path: "/explore",
    title: "Kort-visning 🗺️",
    body: "Tryk her for at se boligerne på et kort i stedet for en liste — perfekt når området betyder mest.",
  },
  {
    target: "explore-search",
    path: "/explore",
    title: "Find dine venner",
    body: "Skift til Roomies-fanen og søg på navn. Forbind med folk, du kender — så kan I senere lave en gruppe sammen.",
  },
  {
    target: "matches-deck",
    path: "/matches",
    title: "Swipe & match 💛",
    body: "Swipe til højre på det, du kan lide. Liker I hinanden, er det et match, og I kan skrive sammen. Har du en gruppe, kan I swipe sammen via knappen i toppen.",
  },
  {
    target: "focus-create-group",
    path: "/focus",
    title: "Søg sammen med venner 👥",
    body: "Opret en gruppe og få fælles chat, gruppe-swipe på boliger og en husstands-hub med opgaver og udgiftsdeling.",
    roles: ["roomie"],
  },
  {
    target: "nav-inbox",
    title: "Beskeder & anmodninger 💬",
    body: "Alle samtaler og anmodninger lander her — og klokken øverst holder dig opdateret med notifikationer.",
  },
  {
    target: null,
    title: "Så er du klar! 🚀",
    body: "God jagt — vi håber, du finder dit nye hjem (eller din nye roomie) på Hommies.",
  },
];

/** Første synlige element med det givne data-tour-id (mobil/desktop kan have hver sit). */
const findVisibleTarget = (id: string): Element | null => {
  const els = Array.from(document.querySelectorAll(`[data-tour="${id}"]`));
  return (
    els.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    }) ?? null
  );
};

/**
 * Førstegangs-rundtur: spotlight-bobler der peger på de vigtige (og lidt gemte)
 * funktioner på tværs af siderne. Vises kun én gang pr. enhed; kan altid
 * springes over ("Nej tak"). Mangler et mål (fx skjult på desktop), springes
 * steppet automatisk over.
 */
const CoachMarkTour = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false); // målet er fundet og målt
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);

  const startedRef = useRef(false);
  const targetElRef = useRef<Element | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<number | null>(null);

  const steps = STEPS.filter(
    (s) => !s.roles || s.roles.includes(profile?.user_type === "landlord" ? "landlord" : "roomie"),
  );
  const step = steps[index];
  const isLast = index === steps.length - 1;

  // Start: første login (nøglen ikke sat), logget ind, på forsiden.
  useEffect(() => {
    if (startedRef.current || !user || !profile) return;
    if (localStorage.getItem(SEEN_KEY)) return;
    if (location.pathname !== "/") return;
    const t = setTimeout(() => {
      startedRef.current = true;
      setActive(true);
    }, 1200);
    return () => clearTimeout(t);
  }, [user, profile, location.pathname]);

  const finish = useCallback(
    (completed: boolean) => {
      localStorage.setItem(SEEN_KEY, "true");
      setActive(false);
      if (completed) navigate("/");
    },
    [navigate],
  );

  // Find + mål steppets target (efter evt. navigation og lazy-load af siden).
  useEffect(() => {
    if (!active || !step) return;
    setReady(false);
    setRect(null);
    setBubblePos(null);
    targetElRef.current = null;

    if (step.path && location.pathname !== step.path) {
      navigate(step.path);
      return; // effekten kører igen når pathname er skiftet
    }
    if (!step.target) {
      setReady(true); // centreret boble
      return;
    }

    let tries = 0;
    const poll = () => {
      const el = findVisibleTarget(step.target!);
      if (el) {
        targetElRef.current = el;
        el.scrollIntoView({ block: "center", behavior: "auto" });
        // Kort pause så scroll/layout falder på plads før måling.
        window.setTimeout(() => {
          const r = targetElRef.current?.getBoundingClientRect();
          if (r) {
            setRect(r);
            setReady(true);
          }
        }, 250);
        return;
      }
      if (++tries < 20) {
        pollRef.current = window.setTimeout(poll, 150);
      } else {
        // Målet findes ikke her (fx rolle/visning) — spring steppet over.
        setIndex((i) => (i + 1 < steps.length ? i + 1 : i));
        if (index + 1 >= steps.length) finish(true);
      }
    };
    poll();
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index, location.pathname]);

  // Genmål ved resize/scroll, så spotlight følger elementet.
  useEffect(() => {
    if (!active || !rect) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = targetElRef.current?.getBoundingClientRect();
        if (r) setRect(r);
      });
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      cancelAnimationFrame(raf);
    };
  }, [active, rect === null]);

  // Placér boblen over/under målet, altid inden for skærmen.
  useLayoutEffect(() => {
    if (!active || !ready || !rect || !bubbleRef.current) return;
    const b = bubbleRef.current;
    const w = b.offsetWidth;
    const h = b.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 12;
    const fitsBelow = rect.bottom + pad + h <= vh - 16;
    const top = fitsBelow ? rect.bottom + pad : Math.max(16, rect.top - pad - h);
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - w / 2), vw - w - 16);
    setBubblePos({ top, left });
  }, [active, ready, rect]);

  // Escape lukker.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!active || !step) return null;

  const next = () => (isLast ? finish(true) : setIndex((i) => i + 1));
  const isWelcome = index === 0;
  const centered = !step.target;

  return (
    <div
      className={`fixed inset-0 z-[130] ${centered ? "bg-foreground/55 backdrop-blur-[2px] flex items-center justify-center p-4" : ""}`}
      role="dialog"
      aria-label="Rundtur"
    >
      {/* Spotlight-hul omkring målet — den store skygge dæmper resten af skærmen */}
      {rect && (
        <div
          aria-hidden
          className="fixed rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: "0 0 0 100vmax hsl(var(--foreground) / 0.55)",
          }}
        />
      )}

      {/* Boblen */}
      {ready && (
        <div
          ref={bubbleRef}
          className={`${centered ? "" : "fixed"} w-[min(calc(100vw-32px),340px)] rounded-3xl bg-background border border-border/60 shadow-soft-lg p-5 animate-scale-in`}
          style={
            centered
              ? undefined
              : { top: bubblePos?.top ?? 0, left: bubblePos?.left ?? 0, visibility: bubblePos ? "visible" : "hidden" }
          }
        >
          <button
            onClick={() => finish(false)}
            aria-label="Luk rundtur"
            className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-foreground/50"
          >
            <X className="w-4 h-4" />
          </button>

          <h3 className="font-display text-xl text-foreground pr-8">{step.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{step.body}</p>

          {/* Prikker */}
          <div className="flex items-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-foreground" : "w-1.5 bg-foreground/20"}`}
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {isWelcome ? (
              <button onClick={() => finish(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Nej tak til tips
              </button>
            ) : (
              <button onClick={() => finish(false)} className="text-sm text-muted-foreground hover:text-foreground">
                Spring over
              </button>
            )}
            <Button onClick={next} className="rounded-full h-10 px-5 bg-foreground text-background hover:bg-foreground/90">
              {isWelcome ? "Vis mig rundt" : isLast ? "Færdig" : "Næste"}
              {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachMarkTour;
