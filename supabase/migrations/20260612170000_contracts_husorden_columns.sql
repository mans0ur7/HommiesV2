-- Husorden fields the ContractWizard client already sends but the live table
-- never got (the SQL lived in a loose, never-applied file). Without these,
-- creating a document fails with "Could not find the 'effective_date' column
-- of 'contracts' in the schema cache".
alter table public.contracts
  add column if not exists quiet_hours    text,
  add column if not exists kitchen_rules  text,
  add column if not exists guest_policy   text,
  add column if not exists noise_policy   text,
  add column if not exists effective_date date;
