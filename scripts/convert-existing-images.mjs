#!/usr/bin/env node
/**
 * Convert all existing generated article JPG/PNG files to optimized WebP.
 * No API calls or API keys are required.
 *
 * npm run images:convert
 * npm run images:convert -- --delete-originals
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const IMAGE_DIR = path.join(ROOT, "assets/images/articles");
const MANIFEST_PATH = path.join(ROOT, "data/article-images.json");
const deleteOriginals = process.argv.includes("--delete-originals");

async function readManifest() {
  try {
    const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
    return manifest && typeof manifest === "object" && !Array.isArray(manifest)
      ? manifest
      : {};
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeManifest(manifest) {
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => Number(a) - Number(b)),
  );
  const tempPath = `${MANIFEST_PATH}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(sorted, null, 2)}\n`);
  await fs.rename(tempPath, MANIFEST_PATH);
}

async function main() {
  const files = await fs.readdir(IMAGE_DIR);
  const sources = files.filter((name) => /^article-\d+\.(?:jpe?g|png)$/i.test(name));
  const manifest = await readManifest();
  let converted = 0;
  let reused = 0;

  for (const name of sources) {
    const match = name.match(/^article-(\d+)\.(?:jpe?g|png)$/i);
    const id = String(Number(match[1]));
    const baseName = `article-${match[1]}`;
    const sourcePath = path.join(IMAGE_DIR, name);
    const outputName = `${baseName}.webp`;
    const outputPath = path.join(IMAGE_DIR, outputName);

    try {
      await fs.access(outputPath);
      reused++;
    } catch {
      const result = await sharp(sourcePath)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      const tempPath = `${outputPath}.tmp`;
      await fs.writeFile(tempPath, result);
      await fs.rename(tempPath, outputPath);
      converted++;
    }

    manifest[id] = {
      ...manifest[id],
      src: `./assets/images/articles/${outputName}`,
      alt: manifest[id]?.alt || `Graphic illustration for article ${id}`,
      style: manifest[id]?.style || "graphic",
    };
    await writeManifest(manifest);
    if (deleteOriginals) await fs.unlink(sourcePath);
    console.log(`${name} → ${outputName}`);
  }

  console.log(`Finished: ${converted} converted, ${reused} WebP already existed.`);
  if (!deleteOriginals) {
    console.log("Original JPG/PNG images are preserved. Verify the site before deleting them.");
  }
}

main().catch((error) => {
  console.error(`WebP conversion failed: ${error.message}`);
  process.exitCode = 1;
});
