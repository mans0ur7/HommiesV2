import { Quote } from "lucide-react";
import { parsePrompts } from "@/data/profilePrompts";

interface ProfilePromptsProps {
  /** Raw value from profiles.prompts (jsonb). */
  prompts: unknown;
  className?: string;
}

/**
 * Viser en brugers profil-prompts som små "kort" — spørgsmålet som dæmpet
 * label og svaret som det fremhævede, så det føles personligt og indbydende.
 */
const ProfilePrompts = ({ prompts, className }: ProfilePromptsProps) => {
  const items = parsePrompts(prompts);
  if (items.length === 0) return null;

  return (
    <div className={className}>
      <div className="space-y-3">
        {items.map((p, i) => (
          <div
            key={i}
            className="relative rounded-2xl border border-border/60 bg-card shadow-soft p-4 pl-5"
          >
            <Quote className="absolute right-4 top-4 w-4 h-4 text-secondary/60" aria-hidden />
            <p className="text-[11px] uppercase tracking-[0.14em] text-foreground/50">
              {p.prompt}
            </p>
            <p className="mt-1.5 font-display text-lg text-foreground leading-snug">
              {p.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePrompts;
