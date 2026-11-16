/* ========== THE JOURNAL — STORY SUBJECTS AND KEYWORDS ========== */

/*
  DummyJSON tags describe categories, but often not the story's actual
  subject. These rules identify concrete subjects in the title or body.

  Related topics are suggestions, NOT tags supplied by DummyJSON.
  Add a new rule when you notice a topic that the site does not recognize.
*/

// A manual search-term correction for articles with misleading titles/tags.
// These are keywords, not image addresses or API credentials.
const SEARCH_OVERRIDES = {
  3: "forest wildfire smoke",
  4: "chocolate candy bars",
};

const SUBJECT_RULES = [
  {
    pattern: /\b(?:wildfires?|forest fires?|forest burned|forest burning)\b/i,
    query: "forest wildfire smoke",
    topics: ["Wildfire", "Forests", "Nature"],
    priority: 3,
  },
  {
    pattern: /\b(?:candy bars?|chocolate bars?|chocolates?|candies)\b/i,
    query: "chocolate candy bars",
    topics: ["Candy", "Chocolate", "Food"],
    priority: 3,
  },
  {
    pattern: /\b(?:forest|woods|woodland|trees?)\b/i,
    query: "forest woodland trees",
    topics: ["Forests", "Nature"],
  },
  {
    pattern: /\b(?:ocean|sea|beach|coast|waves?)\b/i,
    query: "ocean coastline beach",
    topics: ["Ocean", "Coast", "Nature"],
  },
  {
    pattern: /\b(?:storm|thunder|lightning|hurricane)\b/i,
    query: "storm clouds lightning",
    topics: ["Storms", "Weather"],
  },
  {
    pattern: /\b(?:winter|snow|blizzard|snowfall)\b/i,
    query: "winter snow landscape",
    topics: ["Winter", "Nature"],
  },
  {
    pattern: /\b(?:mountains?|cliffs?|valleys?|hiking)\b/i,
    query: "mountain landscape hiking",
    topics: ["Mountains", "Outdoors"],
  },
  {
    pattern: /\b(?:gardens?|flowers?|blooms?|roses?)\b/i,
    query: "garden flowers botanical",
    topics: ["Gardens", "Flowers", "Nature"],
  },
  {
    pattern: /\b(?:piano|guitar|violin|concert|musician|music)\b/i,
    query: "musical instruments concert",
    topics: ["Music", "Culture"],
  },
  {
    pattern: /\b(?:cities|city|streets?|skyline|buildings?)\b/i,
    query: "city street architecture",
    topics: ["City life", "Architecture"],
  },
  {
    pattern: /\b(?:books?|reading|library|novels?)\b/i,
    query: "books library reading",
    topics: ["Books", "Reading"],
  },
  {
    pattern: /\b(?:computers?|technology|software|internet|coding)\b/i,
    query: "computer technology workspace",
    topics: ["Technology", "Computers"],
  },
  {
    pattern: /\b(?:dogs?|puppies|cats?|kittens?|pets?)\b/i,
    query: "pets dogs cats",
    topics: ["Pets", "Animals"],
  },
  {
    pattern: /\b(?:coffee|cafe|café|espresso)\b/i,
    query: "coffee cup cafe",
    topics: ["Coffee", "Food"],
  },
  {
    pattern: /\b(?:cooking|kitchen|restaurant|dinner|meal|recipe)\b/i,
    query: "food cooking kitchen",
    topics: ["Food", "Cooking"],
  },
  {
    pattern: /\b(?:football|basketball|tennis|athlete|sports?)\b/i,
    query: "sports athletics stadium",
    topics: ["Sports", "Activity"],
  },
  {
    pattern: /\b(?:airplane|aircraft|airport|flight|travel|journey)\b/i,
    query: "travel airplane journey",
    topics: ["Travel", "Journeys"],
  },
  {
    pattern: /\b(?:cars?|vehicles?|driving|highway|traffic)\b/i,
    query: "cars road driving",
    topics: ["Cars", "Transport"],
  },
  {
    pattern: /\b(?:school|student|classroom|teacher|education)\b/i,
    query: "school classroom education",
    topics: ["Education", "Learning"],
  },
  {
    pattern: /\b(?:stars?|planets?|moon|galaxy|astronomy|spacecraft)\b/i,
    query: "space astronomy night sky",
    topics: ["Space", "Science"],
  },
];

const GENERIC_TAGS = new Set([
  "english", "american", "french", "history", "mystery", "magical",
  "fiction", "general", "story", "stories",
]);

const STOP_WORDS = new Set([
  "about", "after", "again", "almost", "another", "before",
  "being", "could", "every", "first", "found", "going",
  "great", "having", "inside", "their", "there", "these",
  "those", "through", "under", "until", "watch", "watched",
  "where", "which", "while", "would", "house", "story",
  "stories", "someone", "something", "really", "never",
  "always", "started", "looked", "everything", "anything",
  "without", "people", "wanted", "seemed", "nothing",
]);

/**
 * Rank matching rules: a title match is stronger than a body match,
 * which is stronger than a category/tag match.
 */
function getMatchingRules(post) {
  const title = String(post?.title ?? "");
  const body = String(post?.body ?? "").slice(0, 500);
  const tags = Array.isArray(post?.tags) ? post.tags.join(" ") : "";

  return SUBJECT_RULES.map((rule, index) => {
    let score = 0;
    if (rule.pattern.test(title)) score = 100;
    else if (rule.pattern.test(body)) score = 40;
    else if (rule.pattern.test(tags)) score = 15;

    return {
      rule,
      index,
      score: score > 0 ? score + (rule.priority ?? 0) : 0,
    };
  })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
}

/**
 * Choose an image-search phrase based on what the story describes.
 *
 * @param {Object} post - DummyJSON post.
 * @returns {string} Search keywords.
 */
export function getImageSearchQuery(post) {
  if (Object.hasOwn(SEARCH_OVERRIDES, post?.id)) {
    return SEARCH_OVERRIDES[post.id];
  }

  const matches = getMatchingRules(post);
  if (matches.length > 0) return matches[0].rule.query;

  // Use meaningful title words, not a whole fictional sentence.
  const titleWords = String(post?.title ?? "")
    .toLowerCase()
    .match(/[a-z]{4,}/g) ?? [];

  const words = titleWords
    .filter((word) => !STOP_WORDS.has(word))
    .slice(0, 3);
  if (words.length > 0) return words.join(" ");

  // Generic language/genre tags make poor photographic search terms.
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  return tags.find(
    (tag) => typeof tag === "string" &&
      !GENERIC_TAGS.has(tag.trim().toLowerCase()),
  ) ?? "";
}

/**
 * Suggested topics from the article content, distinct from API tags.
 * Only show topics supported by a recognized subject rule.
 *
 * @param {Object} post - DummyJSON post.
 * @returns {string[]} Up to five unique related topics.
 */
export function getRelatedTopics(post) {
  const originalTags = new Set(
    (Array.isArray(post?.tags) ? post.tags : [])
      .filter((tag) => typeof tag === "string")
      .map((tag) => tag.trim().toLowerCase()),
  );
  const result = [];
  const seen = new Set(originalTags);

  for (const { rule } of getMatchingRules(post)) {
    for (const topic of rule.topics) {
      const key = topic.toLowerCase();
      if (!seen.has(key)) {
        result.push(topic);
        seen.add(key);
      }
      if (result.length === 5) return result;
    }
  }

  return result;
}
