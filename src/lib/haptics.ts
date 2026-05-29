// Thin wrapper around @capacitor/haptics so we can call vibration helpers
// without having to handle the "not on native" case at every call site.
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNativeApp } from "./native";

const safe = (fn: () => Promise<unknown>) => {
  if (!isNativeApp()) return;
  fn().catch(() => {
    // ignore haptics errors; they're never load-bearing for a feature working
  });
};

export const hapticLight = () => safe(() => Haptics.impact({ style: ImpactStyle.Light }));
export const hapticMedium = () => safe(() => Haptics.impact({ style: ImpactStyle.Medium }));
export const hapticHeavy = () => safe(() => Haptics.impact({ style: ImpactStyle.Heavy }));

export const hapticSuccess = () => safe(() => Haptics.notification({ type: NotificationType.Success }));
export const hapticWarning = () => safe(() => Haptics.notification({ type: NotificationType.Warning }));
export const hapticError = () => safe(() => Haptics.notification({ type: NotificationType.Error }));

export const hapticSelection = () => safe(() => Haptics.selectionStart());
