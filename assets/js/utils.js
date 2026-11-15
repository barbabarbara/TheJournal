
/* ----- Character utilities ----- */

// Create one reusable grapheme segmenter.
const segmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

/**
 * Split a string into user-perceived characters.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function getCharacters(text) {
  return Array.from(
    segmenter.segment(text),
    ({ segment }) => segment,
  );
}

/**
 * Count user-perceived characters.
 *
 * @param {string} text
 * @returns {number}
 */
export function countCharacters(text) {
  return getCharacters(text).length;
}

/**
 * Shorten text without splitting complex characters.
 *
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength) {
  const characters = getCharacters(text);

  if (characters.length <= maxLength) {
    return text;
  }

  return `${characters
    .slice(0, maxLength)
    .join("")
    .trimEnd()}…`;
}
