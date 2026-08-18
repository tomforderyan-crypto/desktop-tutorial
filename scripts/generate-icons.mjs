import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(root, "..");
const iconSvg = readFileSync(path.join(root, "icon-source.svg"));
const maskableSvg = readFileSync(path.join(root, "icon-source-maskable.svg"));

const outDir = path.join(projectRoot, "public", "icons");

const targets = [
  { file: "icon-192.png", size: 192, svg: iconSvg },
  { file: "icon-512.png", size: 512, svg: iconSvg },
  { file: "maskable-192.png", size: 192, svg: maskableSvg },
  { file: "maskable-512.png", size: 512, svg: maskableSvg },
  { file: "apple-touch-icon.png", size: 180, svg: iconSvg },
];

for (const t of targets) {
  await sharp(t.svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(path.join(outDir, t.file));
  console.log("wrote", t.file);
}

await sharp(iconSvg, { density: 384 })
  .resize(32, 32)
  .png()
  .toFile(path.join(projectRoot, "public", "favicon.png"));
console.log("wrote favicon.png");
