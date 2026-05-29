// Update brand assets: favicon, Android launcher icons, Play assets
// Source: android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png (current clean icon)
// Outputs:
//  - public/favicon.ico + favicon-32.png + favicon-16.png
//  - android launcher icons at all dpi (already exist — refresh)
//  - play-store-assets/app-icon-512.png (already generated)

import sharp from "sharp";
import { mkdir, copyFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SOURCE = join(ROOT, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png");

// ---------- 1) Favicon (browser tab) ----------
await sharp(SOURCE)
  .resize(32, 32, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toFile(join(ROOT, "public/favicon-32.png"));

await sharp(SOURCE)
  .resize(16, 16, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toFile(join(ROOT, "public/favicon-16.png"));

// favicon.ico — keep simple, use 32x32 PNG (browsers accept this)
await sharp(SOURCE)
  .resize(48, 48, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toFile(join(ROOT, "public/favicon.ico"));

console.log("✓ public/favicon.ico (48x48)");
console.log("✓ public/favicon-32.png");
console.log("✓ public/favicon-16.png");

// ---------- 2) Apple touch icon (iOS later, harmless on Android) ----------
await sharp(SOURCE)
  .resize(180, 180, { kernel: sharp.kernel.lanczos3 })
  .png({ compressionLevel: 9 })
  .toFile(join(ROOT, "public/apple-touch-icon.png"));

console.log("✓ public/apple-touch-icon.png (180x180)");

console.log("\nDone.");
