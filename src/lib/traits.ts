// Single source of truth for roomie personality & lifestyle traits and their
// colors. Used by the profile editors (Profile / UserProfile) for the solid
// selector dots, and by the profile modals (Matches / Explore) for the tinted
// badges. Keep this list in sync with the options users can pick — adding a new
// trait here automatically gives it a color everywhere.

export interface TraitOption {
  label: string;
  /** Solid swatch color for selector dots, e.g. "bg-blue-500". */
  color: string;
}

export const personalityOptions: TraitOption[] = [
  { label: "Rolig", color: "bg-green-500" },
  { label: "Introvert", color: "bg-pink-500" },
  { label: "Ekstrovert", color: "bg-orange-500" },
  { label: "Venlig", color: "bg-cyan-500" },
  { label: "Optimistisk", color: "bg-blue-500" },
  { label: "Kreativ", color: "bg-purple-500" },
  { label: "Analytisk", color: "bg-indigo-500" },
  { label: "Social", color: "bg-yellow-500" },
  { label: "Tålmodig", color: "bg-teal-500" },
  { label: "Eventyrlysten", color: "bg-rose-500" },
  { label: "Omsorgsfuld", color: "bg-emerald-500" },
  { label: "Åben", color: "bg-amber-500" },
];

export const lifestyleOptions: TraitOption[] = [
  { label: "Eventyrer", color: "bg-blue-500" },
  { label: "Atlet", color: "bg-pink-500" },
  { label: "Bogorm", color: "bg-yellow-500" },
  { label: "Morgenfugl", color: "bg-orange-500" },
  { label: "Natugel", color: "bg-purple-500" },
  { label: "Fitness", color: "bg-green-500" },
  { label: "Ikke-ryger", color: "bg-cyan-500" },
  { label: "Dyreelsker", color: "bg-red-500" },
  { label: "Drikker ikke", color: "bg-emerald-500" },
  { label: "Fester ikke", color: "bg-indigo-500" },
  { label: "Veganer", color: "bg-lime-500" },
  { label: "Vegetar", color: "bg-teal-500" },
  { label: "Renlighed", color: "bg-sky-500" },
  { label: "Hjemme-hygge", color: "bg-amber-500" },
  { label: "Studerende", color: "bg-violet-500" },
  { label: "Arbejdende", color: "bg-slate-500" },
];

// Tinted badge class per solid swatch color. Written out as full literal
// strings so Tailwind's content scanner keeps them (it can't see dynamically
// built class names like `bg-${family}-100`).
const BADGE_BY_COLOR: Record<string, string> = {
  "bg-green-500": "bg-green-100 text-green-700",
  "bg-pink-500": "bg-pink-100 text-pink-700",
  "bg-orange-500": "bg-orange-100 text-orange-700",
  "bg-cyan-500": "bg-cyan-100 text-cyan-700",
  "bg-blue-500": "bg-blue-100 text-blue-700",
  "bg-purple-500": "bg-purple-100 text-purple-700",
  "bg-indigo-500": "bg-indigo-100 text-indigo-700",
  "bg-yellow-500": "bg-yellow-100 text-yellow-700",
  "bg-teal-500": "bg-teal-100 text-teal-700",
  "bg-rose-500": "bg-rose-100 text-rose-700",
  "bg-emerald-500": "bg-emerald-100 text-emerald-700",
  "bg-amber-500": "bg-amber-100 text-amber-700",
  "bg-red-500": "bg-red-100 text-red-700",
  "bg-lime-500": "bg-lime-100 text-lime-700",
  "bg-sky-500": "bg-sky-100 text-sky-700",
  "bg-violet-500": "bg-violet-100 text-violet-700",
  "bg-slate-500": "bg-slate-100 text-slate-700",
};

const TRAIT_COLOR = new Map<string, string>(
  [...personalityOptions, ...lifestyleOptions].map((o) => [o.label, o.color]),
);

const FALLBACK_BADGE = "bg-stone-100 text-stone-700";

/** Tinted badge class (bg + text) for a trait label, for profile modal pills. */
export function getTraitBadgeClass(label: string): string {
  const color = TRAIT_COLOR.get(label);
  return (color && BADGE_BY_COLOR[color]) || FALLBACK_BADGE;
}

/** Solid dot/swatch color for a trait label, for the profile editor selectors. */
export function getTraitDotColor(label: string): string {
  return TRAIT_COLOR.get(label) || "bg-gray-400";
}
