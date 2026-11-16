/* ========== THE JOURNAL — LOCAL AI IMAGES ========== */
/*
 * The public website never calls Cloudflare or sees your API token.
 * The generator saves images locally and records them in a JSON manifest.
 * Existing blog design and CSS are unchanged except image-only rules.
 */

export const DEFAULT_ARTICLE_IMAGE = "./assets/images/empty_book.jpg";
const MANIFEST_URL = "./data/article-images.json";
let manifestPromise;

async function getManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL)
      .then(async (response) => {
        if (!response.ok) return {};
        const result = await response.json();
        return result && typeof result === "object" && !Array.isArray(result)
          ? result : {};
      })
      .catch(() => ({}));
  }
  return manifestPromise;
}

/**
 * Return a local image path for an article. If an older generator has left an
 * image file but no manifest entry, the conventional article-ID path works.
 * The img 'error' handler on each page manages missing image files.
 */
export async function findArticleImage(post) {
  const manifest = await getManifest();
  const entry = manifest[String(post?.id)];
  const src = (typeof entry?.src === "string" && entry.src.trim())
    ? entry.src
    : `./assets/images/articles/article-${String(post?.id).padStart(3, "0")}.jpg`;

  return {
    src,
    alt: entry?.alt || `Graphic illustration for ${post?.title || "the article"}`,
    source: null,
    sourceLabel: null,
    creator: entry?.creator || "The Journal",
    license: "AI-generated illustration",
    theme: "graphic",
  };
}
