import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = "C:/Users/Manso/Downloads/hommies-box-color-1024.png";
const assets = resolve(root, "assets");

const ROSE = { r: 255, g: 194, b: 187, alpha: 1 }; // #FFC2BB
const NAVY = { r: 3, g: 42, b: 59, alpha: 1 }; // #032A3B
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

const solid = (w, h, bg) =>
  sharp({ create: { width: w, height: h, channels: 4, background: bg } }).png();

async function splash(file, bg, logoSize) {
  const logo = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await solid(2732, 2732, bg)
    .composite([{ input: logo, gravity: "center" }])
    .toFile(resolve(assets, file));
}

await sharp(SRC).toFile(resolve(assets, "icon-only.png"));
await sharp(SRC).toFile(resolve(assets, "icon-foreground.png"));
await solid(1024, 1024, ROSE).toFile(resolve(assets, "icon-background.png"));
await splash("splash.png", WHITE, 820);
await splash("splash-dark.png", NAVY, 820);

console.log("Generated:", ["icon-only", "icon-foreground", "icon-background", "splash", "splash-dark"].join(", "));
