-- Social feature: Hinge-stil profil-prompts. Hver bruger kan vælge op til 3
-- prompt-spørgsmål og besvare dem — det gør profiler personlige og samtale-startende.
-- Gemmes som en jsonb-liste af { prompt, answer }. Dækket af de eksisterende
-- profiles select/update-policies (egen række). protect_paid_columns rører den ikke.

alter table public.profiles
  add column if not exists prompts jsonb not null default '[]'::jsonb;
