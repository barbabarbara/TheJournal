
/* ========== THE JOURNAL — API SERVICE ========== */

/* Base address of the DummyJSON REST API. */
const API_BASE_URL = "https://dummyjson.com";

/**
 * Send an HTTP request and return parsed JSON data.
 *
 * Supports GET, POST, PATCH, PUT, and DELETE requests.
 *
 * @param {string} endpoint - The API endpoint.
 * @param {RequestInit} [options={}] - Fetch request settings.
 * @returns {Promise<unknown>} The parsed response data.
 */
async function apiRequest(endpoint, options = {}) {
  // Build the complete URL using the API base address.
  const url = `${API_BASE_URL}${endpoint}`;

  // Create headers while preserving custom headers.
  const headers = new Headers(options.headers);

  // Add the JSON content type when sending a request body.
  if (options.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response;

  try {
    // Send the HTTP request using the supplied options.
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    // Handle failed fetch requests without hiding
    // unrelated programming or JSON parsing errors.
    throw new Error("Unable to contact the API server.", {
      cause: error,
    });
  }

  // Reject unsuccessful HTTP responses.
  if (!response.ok) {
    // Use a fallback when the server provides no status text.
    const message = response.statusText || "Request failed";

    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  // Some successful responses contain no body.
  if (response.status === 204) {
    return null;
  }

  try {
    // Parse the successful response body as JSON.
    return await response.json();
  } catch (error) {
    // Keep JSON parsing failures separate from network errors.
    throw new Error("The API returned invalid JSON.", {
      cause: error,
    });
  }
}

/**
 * Validate that a post ID is a positive integer.
 *
 * @param {number} postId - The post ID to validate.
 */
function validatePostId(postId) {
  if (!Number.isSafeInteger(postId) || postId <= 0) {
    throw new TypeError("Post ID must be a positive integer.");
  }
}

/**
 * Fetch all blog posts from DummyJSON.
 *
 * @returns {Promise<Array>} An array of post objects.
 */
export async function fetchPosts() {
  // Retrieve the API response containing all posts.
  const data = await apiRequest("/posts?limit=0");

  // Verify that the response contains a posts array.
  if (!Array.isArray(data?.posts)) {
    throw new Error("The API returned an invalid posts array.");
  }

  // Return only the posts array.
  return data.posts;
}

/**
 * Fetch a single blog post by its ID.
 *
 * @param {number} postId - The ID of the requested post.
 * @returns {Promise<Object>} The requested post object.
 */
export async function fetchPostById(postId) {
  // Reject invalid IDs before sending a request.
  validatePostId(postId);

  // Request the selected post.
  return apiRequest(`/posts/${postId}`);
}

/**
 * Fetch all comments belonging to a specific post.
 *
 * @param {number} postId - The ID of the blog post.
 * @returns {Promise<Array>} An array of comment objects.
 */
export async function fetchCommentsByPostId(postId) {
  // Reject invalid IDs before sending a request.
  validatePostId(postId);

  // Request all comments belonging to the selected post.
  const data = await apiRequest(
    `/comments/post/${postId}?limit=0`
  );

  // Verify that the response contains a comments array.
  if (!Array.isArray(data?.comments)) {
    throw new Error("The API returned an invalid comments array.");
  }

  // Return only the comments array.
  return data.comments;
}
