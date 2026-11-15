/* ========== THE JOURNAL — API SERVICE ========== */

/* Base address of the DummyJSON REST API. */
const API_BASE_URL = "https://dummyjson.com";

/**
 * Send a GET request and return parsed JSON data.
 *
 * @param {string} url - The complete API URL.
 * @returns {Promise<unknown>} The parsed JSON data.
 */
async function getJSON(url) {
  let response;

  try {
    // Send the HTTP GET request.
    response = await fetch(url);
  } catch (error) {
    // Handle a rejected fetch request.
    throw new Error("Unable to contact the API server.", {
      cause: error,
    });
  }

  // Check whether the HTTP response was successful.
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  try {
    // Convert the response body from JSON into JavaScript data.
    return await response.json();
  } catch (error) {
    // Handle invalid JSON returned by the server.
    throw new Error("The API returned invalid JSON.", {
      cause: error,
    });
  }
}

// export allows another JavaScript file to import it.
// async means the function returns a Promise.

/**
 * Fetch all blog posts from DummyJSON.
 *
 * @returns {Promise<Array>} An array of post objects.
 */
export async function fetchPosts() {
  // Retrieve and parse the API response.
  const data = await getJSON(`${API_BASE_URL}/posts?limit=0`);

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
  // Build the API URL using the post ID.
  const url = `${API_BASE_URL}/posts/${postId}`;

  // Request the post and return its parsed JSON data.
  return await getJSON(url);
}
