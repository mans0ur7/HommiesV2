// Compute a 0-100% completeness score for a user profile so we can nudge
// users to fill it in — better profiles → better matches.
// The scoring is intentionally generous: 8 high-signal fields make up the
// bulk of the score, photos count multiple times for the visual depth.

export interface ProfileLike {
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  images?: string[] | null;
  personality?: string[] | null;
  lifestyle?: string[] | null;
  languages?: string[] | null;
  nationality?: string | null;
  work?: string | null;
  study?: string | null;
  monthly_budget?: number | null;
}

interface Step {
  key: string;
  /** Weight: how much this field contributes (sum of all weights = 100) */
  weight: number;
  /** Returns true if this field is considered "done" */
  done: (p: ProfileLike) => boolean;
  /** Label for UX nudges */
  label: string;
}

const steps: Step[] = [
  { key: "name",        weight: 10, done: (p) => !!p.name?.trim(),                    label: "Tilføj dit navn" },
  { key: "age",         weight: 8,  done: (p) => !!p.age,                              label: "Tilføj din alder" },
  { key: "avatar",      weight: 15, done: (p) => !!p.avatar_url,                       label: "Tilføj et profilbillede" },
  { key: "extraPhotos", weight: 10, done: (p) => (p.images?.length ?? 0) >= 1,         label: "Tilføj flere billeder" },
  { key: "bio",         weight: 12, done: (p) => (p.bio?.trim().length ?? 0) >= 30,    label: "Skriv en kort \"om mig\"" },
  { key: "personality", weight: 10, done: (p) => (p.personality?.length ?? 0) >= 3,    label: "Vælg personlighedstags" },
  { key: "lifestyle",   weight: 10, done: (p) => (p.lifestyle?.length ?? 0) >= 3,      label: "Vælg livsstilstags" },
  { key: "languages",   weight: 5,  done: (p) => (p.languages?.length ?? 0) >= 1,      label: "Tilføj sprog du taler" },
  { key: "nationality", weight: 5,  done: (p) => !!p.nationality,                     label: "Tilføj nationalitet" },
  { key: "occupation",  weight: 10, done: (p) => !!p.work?.trim() || !!p.study?.trim(), label: "Tilføj beskæftigelse" },
  { key: "budget",      weight: 5,  done: (p) => !!p.monthly_budget,                  label: "Tilføj månedligt budget" },
];

export interface CompletenessResult {
  percent: number;        // 0-100
  done: number;           // count of steps completed
  total: number;          // total steps
  missing: Step[];        // steps not yet done, in declaration order
}

export function calcProfileCompleteness(profile: ProfileLike | null | undefined): CompletenessResult {
  if (!profile) return { percent: 0, done: 0, total: steps.length, missing: steps };
  let score = 0;
  let done = 0;
  const missing: Step[] = [];
  for (const step of steps) {
    if (step.done(profile)) {
      score += step.weight;
      done += 1;
    } else {
      missing.push(step);
    }
  }
  return { percent: Math.min(100, Math.round(score)), done, total: steps.length, missing };
}
