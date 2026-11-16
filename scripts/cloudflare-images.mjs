/**
 * Cloudflare FLUX.1 Schnell image helpers.
 * These functions never run in the browser and contain no credentials.
 */
export const IMAGE_MODEL = "@cf/black-forest-labs/flux-1-schnell";
export const IMAGE_STYLE = "graphic";
export const MAX_PROMPT_CHARS = 2048;

/**
 * A few story-specific scene directions to prevent the first stories from
 * becoming interchangeable abstract artwork. These are NEW graphic scenes,
 * not prompts for the earlier rejected cinematic/editorial pictures.
 */
const VISUAL_SCENES = {
  1: "An expressive group of four people in conversation; one person is reconsidering a judgment, with contrasting faces and speech-shaped color forms. Show people, not empty chairs.",
  2: "A skilled ice-cream maker's hands expertly swirling a spectacular soft-serve cone in a lively dessert shop.",
  3: "A worried family packing a car with a cat carrier as orange wildfire spreads on a distant forest ridge.",
  4: "A dramatic yet non-graphic convenience-store standoff, with a candy bar prominently on the counter and two expressive characters.",
  5: "A hopeful plan represented by a beautiful paper kite tearing apart in a sudden gust, expressive visual metaphor for a crushed dream.",
  6: "A startled person stranded high in a snowy tree, seen at a respectful distance with tree branches hiding the body; whimsical wintry problem.",
  7: "Friends and family sharing a colorful fruit pie at a table, affectionate gestures and a feeling of love without limits.",
  8: "Outdoor cook tending a glowing campfire rotisserie with food, kettle, and pine trees, friendly graphic scene.",
  9: "A woman cautiously guarding a sealed secret letter, long mysterious violet shadows and a bright yellow lamp.",
  10: "A family rushing out a front door toward a car with bags, coats, and keys, playful dynamic motion lines.",
};

const PALETTES = [
  "cobalt blue, vibrant coral, bright yellow, and turquoise",
  "emerald green, cherry red, sky blue, and warm apricot",
  "electric blue, tangerine, mint green, and lavender",
  "plum purple, sunny yellow, teal, and warm pink",
  "deep navy, lime green, burnt orange, and pale lilac",
];

/**
 * Draw the real subject of the story, not an unrelated tag.
 * The prompt is kept within the Cloudflare model's 2048-char limit.
 */
export function buildGraphicPrompt(post) {
  const id = Number(post?.id) || 0;
  const title = String(post?.title ?? "").replace(/\s+/g, " ").trim();
  const body = String(post?.body ?? "").replace(/\s+/g, " ").trim();
  const palette = PALETTES[id % PALETTES.length];
  const scene = VISUAL_SCENES[id];

  const instructions = [
    "ONE clean colorful graphic illustration for a modern digital magazine article.",
    "Flat vector-inspired art with bold confident shapes, playful geometric forms, crisp edges, and elegant editorial composition.",
    `Harmonious vivid palette: ${palette}, with generous light negative space.`,
    "Illustrate a clear recognizable scene from the article, with varied people, objects, places, motion and viewpoints from story to story.",
    "Visual style: professional contemporary magazine illustration, not childish clip-art or a generic icon.",
    "NO photorealism, NO cinematic photography, NO sepia, NO cut-paper collage, NO paper grain, NO dark moody portraits, NO repeated silhouette motif.",
    "Wide landscape illustration that crops elegantly to a 4:3 rectangle. One complete scene, no panels.",
    "Absolutely no words, letters, typography, logos, borders, or watermarks.",
    scene ? `SCENE: ${scene}` : "",
    `ARTICLE: ${title}`,
    "STORY: ",
  ].filter(Boolean).join("\n");
  const lengthRemaining = Math.max(0, MAX_PROMPT_CHARS - instructions.length);
  return (instructions + body.slice(0, lengthRemaining)).slice(0, MAX_PROMPT_CHARS);
}

export function parseOptions(args) {
  const options = { ids: null, limit: null, overwrite: false, dryRun: false, steps: 4, help: false };
  for (const arg of args) {
    if (arg === "--overwrite") options.overwrite = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg.startsWith("--ids=")) {
      const ids = arg.slice(6).split(",").map((part) => Number(part.trim()));
      if (!ids.length || ids.some((x) => !Number.isSafeInteger(x) || x <= 0)) {
        throw new Error("--ids must contain positive whole numbers (e.g. --ids=1,2).");
      }
      options.ids = [...new Set(ids)];
    } else if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice(8));
      if (!Number.isSafeInteger(n) || n < 1) throw new Error("--limit must be a positive whole number.");
      options.limit = n;
    } else if (arg.startsWith("--steps=")) {
      const n = Number(arg.slice(8));
      if (!Number.isSafeInteger(n) || n < 1 || n > 8) throw new Error("--steps must be between 1 and 8.");
      options.steps = n;
    } else {
      throw new Error(`Unknown option: ${arg}. Try --help.`);
    }
  }
  return options;
}

export function selectPosts(posts, options) {
  if (!Array.isArray(posts)) throw new TypeError("Article data must be an array.");
  let selected = posts.filter((post) => Number.isSafeInteger(post?.id) && post.id > 0);
  if (options.ids) selected = selected.filter((post) => options.ids.includes(post.id));
  if (options.limit) selected = selected.slice(0, options.limit);
  return selected;
}

export function imageExtension(bytes) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  throw new Error("Cloudflare returned an unrecognized image format.");
}

/** Support both raw image bytes and REST JSON envelopes. */
export async function readCloudflareImage(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("json")) {
    const payload = await response.json();
    const base64 = payload?.result?.image ?? payload?.image;
    if (typeof base64 !== "string" || base64.length < 8) {
      throw new Error("Cloudflare returned JSON without a valid image field.");
    }
    const bytes = Buffer.from(base64.replace(/^data:image\/[^;]+;base64,/, ""), "base64");
    imageExtension(bytes);
    return bytes;
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  imageExtension(bytes);
  return bytes;
}

/** Never call this from frontend JavaScript. */
export async function requestCloudflareImage({ accountId, apiToken, post, steps = 4, fetchImpl = fetch }) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${IMAGE_MODEL}`;
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ prompt: buildGraphicPrompt(post), steps }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      const errorItem = body?.errors?.[0];
      if (errorItem?.message) detail = ` ${String(errorItem.message).slice(0, 200)}`;
    } catch {
      // Don't display an untrusted full response or any authorization details.
    }
    detail = detail.replaceAll(apiToken, "[REDACTED]");
    throw new Error(`Cloudflare error HTTP ${response.status}.${detail}`);
  }

  return readCloudflareImage(response);
}
