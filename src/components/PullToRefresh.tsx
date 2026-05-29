import { useEffect, useRef, useState, ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { hapticLight } from "@/lib/haptics";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  /** Pull distance (px) at which refresh fires. Default 70. */
  threshold?: number;
  /** Maximum visual stretch (px) — limits how far the indicator follows. Default 110. */
  maxPull?: number;
  /** Disable on desktop (default true — pointer pull is awkward on mouse). */
  disabledOnDesktop?: boolean;
}

const PullToRefresh = ({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 110,
  disabledOnDesktop = true,
}: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pulled, setPulled] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const triggeredHapticRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (disabledOnDesktop && !("ontouchstart" in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0) return; // only when at top
      startYRef.current = e.touches[0].clientY;
      triggeredHapticRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null || refreshing) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        setPulled(0);
        return;
      }
      // Resistance: every additional pixel pulled becomes less and less of a visible move
      const damped = Math.min(maxPull, delta * 0.55);
      setPulled(damped);
      if (damped >= threshold && !triggeredHapticRef.current) {
        triggeredHapticRef.current = true;
        hapticLight();
      }
    };

    const handleTouchEnd = async () => {
      if (startYRef.current === null) return;
      const currentPull = pulled;
      startYRef.current = null;
      if (currentPull >= threshold && !refreshing) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPulled(0);
        }
      } else {
        setPulled(0);
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, threshold, maxPull, disabledOnDesktop, pulled, refreshing]);

  const reachedThreshold = pulled >= threshold;

  return (
    <div ref={containerRef} className="overflow-y-auto h-full relative">
      <div
        className="absolute left-0 right-0 -top-12 flex items-center justify-center pointer-events-none transition-transform z-10"
        style={{
          transform: `translateY(${refreshing ? threshold : pulled}px)`,
        }}
      >
        <div className="bg-background border border-border rounded-full h-10 w-10 shadow-md flex items-center justify-center">
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin text-foreground" />
          ) : (
            <ArrowDown
              className={`w-4 h-4 transition-transform ${
                reachedThreshold ? "rotate-180 text-secondary" : "text-foreground/60"
              }`}
            />
          )}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${refreshing ? threshold : pulled}px)`,
          transition: pulled === 0 ? "transform 200ms ease-out" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
