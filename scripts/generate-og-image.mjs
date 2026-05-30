// Generate the default 1200x630 Open Graph image used when sharing
// hommies.dk on social platforms (WhatsApp, Twitter, LinkedIn, Slack…).
//
// Peach background (matches the launcher icon) + centered Hommies wordmark.

import sharp from "sharp";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const peachBg = await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { r: 252, g: 201, b: 186, alpha: 1 }, // #FCC9BA
  },
}).png().toBuffer();

const logoPath = join(ROOT, "src/assets/hommies-logo.png");
const logo = await sharp(logoPath)
  .resize(900, null, { kernel: sharp.kernel.lanczos3 })
  .toBuffer();
const logoMeta = await sharp(logo).metadata();

await sharp(peachBg)
  .composite([
    {
      input: logo,
      top: Math.round((630 - logoMeta.height) / 2),
      left: Math.round((1200 - logoMeta.width) / 2),
    },
  ])
  .png({ compressionLevel: 9, quality: 100 })
  .toFile(join(ROOT, "public/hommies-og-image.png"));

console.log("✓ public/hommies-og-image.png (1200x630)");
