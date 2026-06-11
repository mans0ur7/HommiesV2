import { Plus, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROMPT_QUESTIONS, MAX_PROMPTS, type ProfilePrompt } from "@/data/profilePrompts";

interface ProfilePromptsEditorProps {
  value: ProfilePrompt[];
  onChange: (next: ProfilePrompt[]) => void;
}

const ANSWER_MAX = 160;

/**
 * Redigering af op til 3 profil-prompts. Hver række: vælg et spørgsmål
 * (kun ledige spørgsmål tilbydes) + skriv et kort svar.
 */
const ProfilePromptsEditor = ({ value, onChange }: ProfilePromptsEditorProps) => {
  const used = new Set(value.map((p) => p.prompt));
  const canAdd = value.length < MAX_PROMPTS;

  const update = (i: number, patch: Partial<ProfilePrompt>) => {
    onChange(value.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => {
    const firstFree = PROMPT_QUESTIONS.find((q) => !used.has(q)) ?? PROMPT_QUESTIONS[0];
    onChange([...value, { prompt: firstFree, answer: "" }]);
  };

  return (
    <div className="space-y-4">
      {value.map((p, i) => {
        const options = PROMPT_QUESTIONS.filter((q) => q === p.prompt || !used.has(q));
        return (
          <div key={i} className="rounded-2xl border border-border/60 p-4 space-y-3 relative">
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Fjern prompt"
              className="absolute right-3 top-3 w-7 h-7 rounded-full flex items-center justify-center text-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <Select value={p.prompt} onValueChange={(v) => update(i, { prompt: v })}>
              <SelectTrigger className="w-[calc(100%-2rem)] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {options.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Textarea
                value={p.answer}
                onChange={(e) => update(i, { answer: e.target.value.slice(0, ANSWER_MAX) })}
                placeholder="Skriv dit svar…"
                rows={2}
                className="resize-none"
              />
              <div className="mt-1 text-right text-[11px] text-muted-foreground">
                {p.answer.length}/{ANSWER_MAX}
              </div>
            </div>
          </div>
        );
      })}

      {canAdd && (
        <button
          type="button"
          onClick={add}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tilføj prompt ({value.length}/{MAX_PROMPTS})
        </button>
      )}
    </div>
  );
};

export default ProfilePromptsEditor;
