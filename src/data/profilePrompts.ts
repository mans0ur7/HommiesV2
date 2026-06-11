// Hinge-stil profil-prompts. Brugeren vælger op til 3 og besvarer dem, så
// profilen bliver personlig og samtale-startende (i stedet for kun en bio).

export interface ProfilePrompt {
  prompt: string;
  answer: string;
}

export const MAX_PROMPTS = 3;

// Kuraterede spørgsmål — varme, konkrete og roomie-relevante.
export const PROMPT_QUESTIONS: string[] = [
  "Min perfekte søndag derhjemme er…",
  "Et no-go for mig i et bofællesskab er…",
  "Jeg er den type roomie der…",
  "Den bedste ret jeg laver til fælles aftensmad er…",
  "Jeg bliver glad af et hjem hvor…",
  "Mine venner ville beskrive mig som…",
  "Stilhed eller fest i lejligheden?",
  "Det jeg leder efter i en bofælle er…",
  "Min morgenrutine er…",
  "En ting folk skal vide før de bor med mig…",
  "Sådan holder jeg fælles områder…",
  "Det vigtigste i et hjem for mig er…",
  "Jeg drømmer om at bo i…",
  "Min skjulte talent/hobby er…",
  "Weekenden går typisk med…",
];

// Robust parsing af prompts fra DB (jsonb). Filtrerer ufuldstændige/ugyldige væk.
export function parsePrompts(raw: unknown): ProfilePrompt[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (p): p is ProfilePrompt =>
        !!p &&
        typeof (p as any).prompt === "string" &&
        typeof (p as any).answer === "string" &&
        (p as any).answer.trim().length > 0,
    )
    .slice(0, MAX_PROMPTS)
    .map((p) => ({ prompt: p.prompt, answer: p.answer }));
}
