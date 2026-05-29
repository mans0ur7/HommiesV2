import { useEffect, useRef } from "react";

const KEY = "hommies_listing_draft_v1";
const TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface Wrapper<T> {
  savedAt: number;
  data: T;
}

/**
 * Persist a wizard's in-progress form data to localStorage so a user who
 * abandons the new-listing flow can resume right where they left off.
 *
 * Usage: useListingDraft(formData, setFormData) — pass the entire formData
 * object and the setter. The hook will:
 *   - on mount, hydrate formData from localStorage if a draft exists
 *   - on every formData change, debounce-write back to localStorage
 *   - expose `clearDraft()` so the parent can wipe it after publish/submit
 */
export function useListingDraft<T extends object>(
  formData: T,
  setFormData: (data: T) => void,
  isEditing: boolean,
) {
  const hydratedRef = useRef(false);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: hydrate
  useEffect(() => {
    if (isEditing || hydratedRef.current) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const wrapper = JSON.parse(raw) as Wrapper<T>;
      if (Date.now() - wrapper.savedAt > TTL_MS) {
        localStorage.removeItem(KEY);
        return;
      }
      // Merge so any defaults added since are preserved
      setFormData({ ...formData, ...wrapper.data });
      hydratedRef.current = true;
    } catch {
      // ignore parse failures
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced write on every change
  useEffect(() => {
    if (isEditing) return;
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      try {
        const wrapper: Wrapper<T> = { savedAt: Date.now(), data: formData };
        localStorage.setItem(KEY, JSON.stringify(wrapper));
      } catch {
        // Quota or private mode — fine, draft just won't persist
      }
    }, 500);
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [formData, isEditing]);

  const clearDraft = () => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  };

  return { clearDraft };
}
