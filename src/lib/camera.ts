// Wraps @capacitor/camera so the rest of the app can ask for a photo and get
// a File back, regardless of whether we're in the native shell (Camera plugin)
// or the browser (file input fallback).
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNativeApp } from "./native";

/**
 * Returns a single image as a File. Source = "camera" forces the native
 * camera; "gallery" forces the photo library; "prompt" asks the user.
 */
export async function pickImage(source: "camera" | "gallery" | "prompt" = "prompt"): Promise<File | null> {
  if (isNativeApp()) {
    try {
      const photo = await Camera.getPhoto({
        source:
          source === "camera"
            ? CameraSource.Camera
            : source === "gallery"
              ? CameraSource.Photos
              : CameraSource.Prompt,
        quality: 88,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
      });
      if (!photo.dataUrl) return null;
      // Convert data URL -> File so upload code stays the same as web
      const res = await fetch(photo.dataUrl);
      const blob = await res.blob();
      const ext = photo.format || "jpeg";
      return new File([blob], `photo-${Date.now()}.${ext}`, { type: blob.type });
    } catch (e) {
      // user cancelled — return null, callers should be silent on this
      if ((e as Error)?.message?.toLowerCase().includes("cancel")) return null;
      throw e;
    }
  }

  // Web fallback: open a hidden file input
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "camera") input.capture = "user"; // hint mobile browsers to open camera
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      resolve(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}
