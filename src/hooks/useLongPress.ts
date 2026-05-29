import { useEffect, useRef, useCallback } from "react";
import { hapticMedium } from "@/lib/haptics";

interface Options {
  /** Time (ms) before press is considered "long". Default 500. */
  delay?: number;
  /** Fire haptic when long-press triggers. Default true. */
  haptic?: boolean;
}

/**
 * Returns event handlers (onPointerDown, onPointerUp, onPointerLeave,
 * onContextMenu) that detect a long press / right-click and call `onLongPress`.
 * The standard click event continues to work for short taps.
 */
export function useLongPress(onLongPress: () => void, { delay = 500, haptic = true }: Options = {}) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);

  const start = useCallback(() => {
    triggeredRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      triggeredRef.current = true;
      if (haptic) hapticMedium();
      onLongPress();
    }, delay);
  }, [delay, haptic, onLongPress]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => {
      // Right-click on desktop should ALSO trigger the long-press handler
      e.preventDefault();
      if (haptic) hapticMedium();
      onLongPress();
    },
  };
}
