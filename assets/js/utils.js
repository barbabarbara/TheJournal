
/**
 * Count user-perceived characters in a string.
 *
 * Handles emojis and combined Unicode characters.
 *
 * @param {string} text - The text to count.
 * @returns {number} The number of grapheme clusters.
 */
export function countCharacters(text) {
  // Split the string into user-perceived characters.
  const segmenter = new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  });

  // Count the resulting segments.
  return Array.from(segmenter.segment(text)).length;
}
