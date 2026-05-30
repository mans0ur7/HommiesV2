/**
 * Lightweight profanity/spam check for user-generated text on bios + listings.
 *
 * Block-list is intentionally small and conservative: it covers slurs, common
 * Danish/English swears, and the most frequent scam markers (crypto pumps,
 * obvious phishing CTAs). Refinements should add words here, not invent a
 * heavier dependency — anything heavier risks false positives that block
 * legitimate listings.
 */

const PROFANITY = [
  // Danish slurs / strong swears
  "perker", "pikfjæs", "luder", "fisseluder", "kælling", "møgkælling",
  "neger", "neger-",
  // English slurs / strong swears
  "nigger", "nigga", "faggot", "tranny", "retard", "retarded", "kike",
  "chink", "spic", "wetback", "raghead",
  // Common spam / scam markers
  "send bitcoin", "send btc", "send eth", "send usdt", "click here to claim",
  "wire transfer fee", "western union",
];

// Words that often appear in scam contact-info patterns
const PHONE_OUTSIDE_DK = /\+(?!45\b)\d{6,}/;
const SUSPICIOUS_URL = /https?:\/\/(?:bit\.ly|tinyurl\.com|t\.co|telegra\.ph)\b/i;
const EMOJI_SPAM = /(?:[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]){8,}/u;

export interface ContentCheckResult {
  ok: boolean;
  reason?: "profanity" | "spam" | "scam" | "emojiSpam";
  match?: string;
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/\s+/g, " ");

export function checkContent(text: string): ContentCheckResult {
  if (!text) return { ok: true };
  const norm = normalize(text);

  for (const w of PROFANITY) {
    const re = new RegExp(`\\b${w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(norm)) return { ok: false, reason: "profanity", match: w };
  }

  if (SUSPICIOUS_URL.test(text)) return { ok: false, reason: "scam", match: "shortlink" };
  if (PHONE_OUTSIDE_DK.test(text)) return { ok: false, reason: "scam", match: "intl-phone" };
  if (EMOJI_SPAM.test(text)) return { ok: false, reason: "emojiSpam" };

  return { ok: true };
}

/** Convenience: run checks across several fields and return the first failure. */
export function checkFields(fields: Record<string, string | null | undefined>): ContentCheckResult {
  for (const [, value] of Object.entries(fields)) {
    if (!value) continue;
    const r = checkContent(value);
    if (!r.ok) return r;
  }
  return { ok: true };
}
