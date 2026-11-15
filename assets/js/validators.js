/* ========== THE JOURNAL — VALIDATORS ========== */

/**
 * Validate that a post ID is a positive integer.
 *
 * @param {number} postId - The post ID to validate.
 * @throws {TypeError} If the post ID is invalid.
 */
export function validatePostId(postId) {
  if (!Number.isSafeInteger(postId) || postId <= 0) {
    throw new TypeError("Post ID must be a positive integer.");
  }
}

/**
 * Validate comment text before creating a comment.
 *
 * @param {string} body - The comment text.
 * @throws {TypeError} If the comment is empty or invalid.
 */
export function validateComment(body) {
  if (typeof body !== "string" || !body.trim()) {
    throw new TypeError("Comment text cannot be empty.");
  }
}

/**
 * Validate the data used to update a blog post.
 *
 * @param {Object} payload - The article fields to update.
 * @throws {TypeError} If the update data is invalid.
 */
export function validatePostUpdate(payload) {
  // Only these properties can be updated.
  const allowedFields = ["title", "body", "tags"];

  // Reject null, arrays, and non-object values.
  if (
    payload === null ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    throw new TypeError("Update data must be an object.");
  }

  // Get the property names supplied in the update object.
  const fields = Object.keys(payload);

  // Reject empty updates and unsupported properties.
  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    throw new TypeError("Invalid update fields.");
  }

  // Check the values of the supplied properties.
  for (const field of fields) {
    const value = payload[field];

    if (field === "tags") {
      if (
        !Array.isArray(value) ||
        value.some((tag) => typeof tag !== "string" || !tag.trim())
      ) {
        throw new TypeError("Tags must be non-empty strings.");
      }
    } else if (typeof value !== "string" || !value.trim()) {
      throw new TypeError(`${field} must be a non-empty string.`);
    }
  }
}
