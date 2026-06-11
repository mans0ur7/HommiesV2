// Oversætter kendte Supabase-auth-fejl til danske beskeder. Falder tilbage til en
// generisk dansk besked i stedet for at vise rå engelske Supabase-strenge til brugeren.
export function mapAuthError(error: { message?: string; code?: string } | null | undefined): string {
  const msg = (error?.message || "").toLowerCase();
  const code = (error?.code || "").toLowerCase();

  if (msg.includes("invalid login credentials") || code === "invalid_credentials") {
    return "Forkert email eller adgangskode.";
  }
  if (msg.includes("email not confirmed") || code === "email_not_confirmed") {
    return "Din email er ikke bekræftet endnu. Tjek din indbakke for bekræftelseslinket.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered") || code === "user_already_exists" || code === "email_exists") {
    return "Denne email er allerede registreret. Prøv at logge ind i stedet.";
  }
  if (msg.includes("rate limit") || msg.includes("too many requests") || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "For mange forsøg. Vent et øjeblik og prøv igen.";
  }
  if (msg.includes("password should be") || msg.includes("password is too") || code === "weak_password") {
    return "Adgangskoden er for svag. Brug mindst 6 tegn.";
  }
  if (msg.includes("same") && msg.includes("password")) {
    return "Den nye adgangskode må ikke være den samme som den nuværende.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) {
    return "Netværksfejl. Tjek din forbindelse og prøv igen.";
  }
  return "Noget gik galt. Prøv igen.";
}
