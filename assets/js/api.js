
/* ========== THE JOURNAL — API SERVICE ========== */

/* Base address of the DummyJSON REST API. */
const API_BASE_URL = "https://dummyjson.com";


/**
 * Fetch all blog posts from DummyJSON.
 *
 * An async function always returns a Promise.
 *
 * @returns {Promise<Array>} An array of post objects.
 */
export async function fetchPosts() {
    
  try {
    /* Send a GET request to DummyJSON to retrieve all blog posts.
    The URL combines the base API address with /posts?limit=0.
    fetch() returns a Promise, and await waits for the HTTP response.
    The response variable stores the resulting Response object. */
    const response = await fetch(`${API_BASE_URL}/posts?limit=0`);

    // fetch() does not automatically reject on HTTP errors.

    /* Check whether the HTTP response was successful (status 200–299).
   If response.ok is false, create and throw an error containing
   the HTTP status code and message, which will be handled by catch.
   This is necessary because fetch() does not reject on HTTP errors. */
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Convert the JSON response body into a JavaScript object.
    const data = await response.json();

    // Return only the posts array.
    return data.posts;

  } catch (error) {
    // A network failure typically causes fetch() to reject
    // with a TypeError.
    if (error instanceof TypeError) {
      throw new Error(
        "Could not connect to DummyJSON. Check your internet connection.",
        { cause: error }
      );
    }

    // Preserve HTTP and other unexpected errors.
    throw error;
  }
}
