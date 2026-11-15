/* ========== CHARACTER UTILITIES ========== */

/*
 * * Shorten text to a maximum length.
 *
 * @param {string} text - Original text.
 * @param {number} maxLength - Maximum length.
 * @returns {string} Original or shortened text.
 */
export function truncateText(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/**
 * ========== ALTERNATIVE: UNICODE-AWARE TRUNCATION ==========
 *
 * Design decision:
 * This project uses JavaScript's built-in .length and .slice()
 * because article previews contain mostly ordinary text.
 *
 * A Unicode-aware alternative using Intl.Segmenter was explored,
 * but it adds complexity that is not currently necessary.
 *
 * Limitation:
 * .length counts UTF-16 code units rather than user-perceived
 * characters, so slicing may split complex emojis.
 * 
 *
 * This version uses Intl.Segmenter to count and truncate text
 * by grapheme clusters (user-perceived characters).
 *
 * Advantages:
 * - Handles emojis and combining characters correctly.
 * - Avoids splitting complex characters during truncation.
 *
 * Trade-off:
 * - Requires more code than .length and .slice().
 *
 * Decision:
 * Keep the simpler implementation for the current blog.
 * Consider this alternative if precise Unicode handling
 * becomes a requirement.
 *
 * ---------------------------------------------------------
 *
 * const segmenter = new Intl.Segmenter(undefined, {
 *   granularity: "grapheme",
 * });
 *
 * function getCharacters(text) {
 *   return Array.from(
 *     segmenter.segment(text),
 *     ({ segment }) => segment,
 *   );
 * }
 *
 * export function countCharacters(text) {
 *   return getCharacters(text).length;
 * }
 *
 * export function truncateText(text, maxLength) {
 *   const characters = getCharacters(text);
 *
 *   if (characters.length <= maxLength) {
 *     return text;
 *   }
 *
 *   return `${characters
 *     .slice(0, maxLength)
 *     .join("")
 *     .trimEnd()}…`;
 * }
 */
