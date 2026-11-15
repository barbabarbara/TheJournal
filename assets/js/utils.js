
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


// export function countCharacters(text) {
//   // Create a grapheme segmenter.
//   const segmenter = new Intl.Segmenter(undefined, {
//     granularity: "grapheme",
//   });

//   // Divide the text into grapheme segments.
//   const segments = segmenter.segment(text);

//   // Convert the segments iterable into a normal array.
//   const characters = Array.from(segments);

//   // Count the elements in the resulting array.
//   const count = characters.length;

//   // Return the number.
//   return count;
// }

