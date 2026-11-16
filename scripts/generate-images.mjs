#!/usr/bin/env node
/**
 * Generate NEW clean colorful graphic illustrations with Cloudflare FLUX.
 * Run from the project root. Never upload .env to GitHub.
 *
 * npm run images:preview
 * npm run images:one
 * npm run images:five
 * npm run images:all
 * npm run images:all -- --ids=1 --overwrite
 */

// npm run images:all

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import {
  IMAGE_MODEL,
  IMAGE_STYLE,
  buildGraphicPrompt,
  parseOptions,
  requestCloudflareImage,
  selectPosts,
} from "./cloudflare-images.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const POSTS_FILE = path.join(ROOT, "data/posts.json");
const MANIFEST_FILE = path.join(ROOT, "data/article-images.json");
const IMAGES_DIR = path.join(ROOT, "assets/images/articles");

async function loadEnv() {
  try {
    const file = await fs.readFile(path.join(ROOT, ".env"), "utf8");
    for (const line of file.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z_0-9]*)\s*=\s*(.*?)\s*$/);
      if (!match) continue;
      const value = match[2].replace(/^(['"])(.*)\1$/, "$2");
      if (process.env[match[1]] === undefined) {
        process.env[match[1]] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function readManifest() {
  try {
    const data = JSON.parse(await fs.readFile(MANIFEST_FILE, "utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Manifest must contain an object keyed by article ID.");
    }
    return data;
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeManifest(data) {
  const sorted = Object.fromEntries(
    Object.entries(data).sort(([a], [b]) => Number(a) - Number(b)),
  );
  await fs.mkdir(path.dirname(MANIFEST_FILE), { recursive: true });
  const temporary = `${MANIFEST_FILE}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  await fs.rename(temporary, MANIFEST_FILE);
}

async function alreadyGenerated(entry) {
  if (entry?.style !== IMAGE_STYLE || typeof entry?.src !== "string") {
    return false;
  }
  const relative = entry.src.replace(/^\.\//, "");
  if (!/^assets\/images\/articles\/article-\d+\.webp$/i.test(relative)) {
    return false;
  }
  try {
    await fs.access(path.join(ROOT, relative));
    return true;
  } catch {
    return false;
  }
}

function printHelp() {
  console.log(`The Journal — Cloudflare FLUX graphic illustrations

Examples:
  npm run images:preview                   Preview prompt, no API request
  npm run images:one                       Generate article 1
  npm run images:five                      Generate articles 1–5
  npm run images:all                       Generate remaining articles
  npm run images:all -- --ids=1 --overwrite Regenerate article 1
  npm run images:all -- --ids=12,25         Generate selected articles

Options:
  --ids=1,2      Select IDs
  --limit=5      Select first five articles
  --overwrite    Regenerate existing WebP illustrations
  --dry-run      Preview the prompt without using the API
  --steps=4      FLUX steps from 1 to 8
  --help         Show this help`);
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  if (options.help) return printHelp();
  const posts = JSON.parse(await fs.readFile(POSTS_FILE, "utf8"));
  const selected = selectPosts(posts, options);
  if (!selected.length) throw new Error("No articles matched the selected IDs.");

  if (options.dryRun) {
    for (const post of selected) {
      console.log(`\n[${post.id}] ${post.title}\n${buildGraphicPrompt(post)}\n`);
    }
    console.log("Preview complete. No Cloudflare API request was made.");
    return;
  }

  await loadEnv();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!/^[a-f0-9]{32}$/i.test(accountId ?? "")) {
    throw new Error("Set CLOUDFLARE_ACCOUNT_ID in .env (32 hexadecimal characters).");
  }
  if (!apiToken || apiToken.startsWith("your_")) {
    throw new Error("Set CLOUDFLARE_API_TOKEN in .env. Never commit your token.");
  }

  await fs.mkdir(IMAGES_DIR, { recursive: true });
  const manifest = await readManifest();
  let created = 0;
  let skipped = 0;
  console.log(`Model: ${IMAGE_MODEL} | Style: ${IMAGE_STYLE} | Selected: ${selected.length} | Steps: ${options.steps}`);

  for (const post of selected) {
    if (!options.overwrite && await alreadyGenerated(manifest[String(post.id)])) {
      console.log(`[${post.id}] Already has a WebP image — skipped.`);
      skipped++;
      continue;
    }
    console.log(`[${post.id}] Generating: ${post.title}`);
    try {
      const bytes = await requestCloudflareImage({
        accountId, apiToken, post, steps: options.steps,
      });
      // Cloudflare can return JPEG/PNG bytes. Convert the actual image data
      // to WebP; simply changing the extension would create a broken file.
      const webpBytes = await sharp(bytes)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      const filename = `article-${String(post.id).padStart(3, "0")}.webp`;
      const fullpath = path.join(IMAGES_DIR, filename);
      const temporary = `${fullpath}.tmp`;
      await fs.writeFile(temporary, webpBytes);
      await fs.rename(temporary, fullpath);

      manifest[String(post.id)] = {
        src: `./assets/images/articles/${filename}`,
        alt: `Colorful graphic illustration for ${post.title}`,
        creator: "Cloudflare Workers AI",
        model: IMAGE_MODEL,
        style: IMAGE_STYLE,
      };
      await writeManifest(manifest);
      created++;
      console.log(`    Saved ${filename}`);
    } catch (error) {
      console.error(`Stopped at article ${post.id}: ${error.message}`);
      console.error("Already-generated images are safe. Run the command again to resume.");
      process.exitCode = 1;
      break;
    }
  }
  console.log(`Completed: ${created}; skipped: ${skipped}.`);
}

main().catch((error) => {
  console.error(`Image generation failed: ${error.message}`);
  process.exitCode = 1;
});
