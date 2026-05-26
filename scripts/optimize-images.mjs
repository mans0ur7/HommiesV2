// Downscales + recompresses large source images in place (same filenames, so
// imports keep working). Originals are preserved in git history.
//
// Usage: node scripts/optimize-images.mjs
import sharp from "sharp";
import { readdir, stat, rename } from "node:fs/promises";
import { join, extname } from "node:path";

const TARGETS = ["src/assets/cities"];
const MAX_WIDTH = 1280;
const JPEG_QUALITY = 78;

const fmtMB = (b) => (b / 1024 / 1024).toFixed(2) + " MB";

async function optimizeJpeg(path) {
  const before = (await stat(path)).size;
  const tmp = path + ".tmp";
  await sharp(path)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(tmp);
  await rename(tmp, path);
  const after = (await stat(path)).size;
  return { before, after };
}

let totalBefore = 0;
let totalAfter = 0;

for (const dir of TARGETS) {
  const files = await readdir(dir);
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (![".jpg", ".jpeg"].includes(ext)) continue;
    const path = join(dir, file);
    const { before, after } = await optimizeJpeg(path);
    totalBefore += before;
    totalAfter += after;
    console.log(`${file.padEnd(32)} ${fmtMB(before).padStart(10)} -> ${fmtMB(after).padStart(10)}`);
  }
}

console.log("-".repeat(60));
console.log(`TOTAL ${fmtMB(totalBefore)} -> ${fmtMB(totalAfter)}  (saved ${fmtMB(totalBefore - totalAfter)})`);
