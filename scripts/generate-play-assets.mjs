// Generate Play Store assets (app icon 512x512 + feature graphic 1024x500)
// from the existing Android launcher icon. Run with: node scripts/generate-play-assets.mjs
// Output: play-store-assets/

import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "play-store-assets");

await mkdir(OUT, { recursive: true });

// ---------- 1) App icon: 512x512 PNG ----------
// Use the high-res Android launcher icon (192x192) as source, upscale to 512.
const launcherPath = join(ROOT, "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png");

await sharp(launcherPath)
  .resize(512, 512, {
    kernel: sharp.kernel.lanczos3, // best quality upscale
    withoutEnlargement: false,
  })
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(join(OUT, "app-icon-512.png"));

console.log("✓ app-icon-512.png (512x512)");

// ---------- 2) Feature graphic: 1024x500 PNG ----------
// Peach background (#FCC9BA - matches the launcher background) with the
// Hommies wordmark logo centered.
const peachBg = await sharp({
  create: {
    width: 1024,
    height: 500,
    channels: 4,
    background: { r: 252, g: 201, b: 186, alpha: 1 }, // peach #FCC9BA
  },
})
  .png()
  .toBuffer();

// Load the horizontal logo (264x74) and scale it up for the feature graphic.
// Target the logo at ~600px wide to leave breathing room.
const logoPath = join(ROOT, "src/assets/hommies-logo.png");
const logoResized = await sharp(logoPath)
  .resize(700, null, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const logoMeta = await sharp(logoResized).metadata();

await sharp(peachBg)
  .composite([
    {
      input: logoResized,
      top: Math.round((500 - logoMeta.height) / 2),
      left: Math.round((1024 - logoMeta.width) / 2),
    },
  ])
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(join(OUT, "feature-graphic-1024x500.png"));

console.log("✓ feature-graphic-1024x500.png (1024x500)");

console.log(`\nDone. Assets in: ${OUT}`);
