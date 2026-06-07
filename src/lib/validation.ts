import { z } from "zod";

// Single source of truth for credential validation. Used at signup, password
// reset, and the Settings password change — the latter previously only required
// 6 characters, which let users set a weaker password than signup allowed.
export const passwordSchema = z
  .string()
  .min(8, "Adgangskode skal være mindst 8 tegn")
  .regex(/[A-Z]/, "Adgangskode skal indeholde mindst ét stort bogstav")
  .regex(/[0-9]/, "Adgangskode skal indeholde mindst ét tal");

export const emailSchema = z.string().email("Ugyldig email-adresse");
