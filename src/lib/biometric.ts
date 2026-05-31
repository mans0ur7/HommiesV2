// Thin wrapper around @aparajita/capacitor-biometric-auth so the rest of
// the app can ask "is biometric available?" and "authenticate now" without
// thinking about the native/web split.
//
// We store a flag that says "the user opted in to biometric quick-login on this
// device", their Supabase email, and the Supabase refresh token. After a
// successful biometric prompt we exchange that refresh token for a fresh
// session (supabase.auth.refreshSession) so the user is actually logged in —
// no password needed. The refresh token lives at the same security level as the
// session Supabase already persists in localStorage, and is kept current on
// every token refresh (see AuthContext) so it survives rotation.

import { BiometricAuth, BiometryType } from "@aparajita/capacitor-biometric-auth";
import { isNativeApp } from "./native";

const ENABLED_KEY = "hommies_biometric_enabled_v1";
const EMAIL_KEY = "hommies_biometric_email_v1";
const TOKEN_KEY = "hommies_biometric_token_v1";

export interface BiometricStatus {
  available: boolean;
  type: BiometryType;
  reason?: string;
}

export async function checkBiometricAvailable(): Promise<BiometricStatus> {
  if (!isNativeApp()) {
    return { available: false, type: BiometryType.none, reason: "web" };
  }
  try {
    const info = await BiometricAuth.checkBiometry();
    return {
      available: info.isAvailable,
      type: info.biometryType,
      reason: info.reason,
    };
  } catch {
    return { available: false, type: BiometryType.none, reason: "error" };
  }
}

export async function authenticateBiometric(reason: string): Promise<boolean> {
  if (!isNativeApp()) return false;
  try {
    await BiometricAuth.authenticate({
      reason,
      androidTitle: "Log ind i Hommies",
      androidSubtitle: reason,
      androidConfirmationRequired: false,
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}

export function isBiometricEnabled(): boolean {
  try { return localStorage.getItem(ENABLED_KEY) === "true"; } catch { return false; }
}

export function getBiometricEmail(): string | null {
  try { return localStorage.getItem(EMAIL_KEY); } catch { return null; }
}

export function enableBiometricForEmail(email: string): void {
  try {
    localStorage.setItem(ENABLED_KEY, "true");
    localStorage.setItem(EMAIL_KEY, email);
  } catch { /* ignore */ }
}

export function disableBiometric(): void {
  try {
    localStorage.removeItem(ENABLED_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

/** Store/refresh the Supabase refresh token used for biometric quick-login. */
export function storeBiometricToken(refreshToken: string): void {
  try { localStorage.setItem(TOKEN_KEY, refreshToken); } catch { /* ignore */ }
}

export function getBiometricToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
