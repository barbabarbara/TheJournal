
/* ========== THE JOURNAL — MANUAL API TESTS ========== */

/*
 * Purpose:
 * Verify the GET functions, response handling, and input validation
 * implemented in assets/js/api.js.
 *
 * Run these tests in Chrome DevTools Console while the website
 * is open through Live Server.
 *
 * These tests use real HTTP requests to DummyJSON.
 */

/* ========== 01. IMPORT API FUNCTIONS ========== */

(async () => {
  const {
    fetchPosts,
    fetchPostById,
    fetchCommentsByPostId,
  } = await import("./assets/js/api.js");

  /* ========== 02. TEST HELPER ========== */

  /**
   * Run one test and display a clear PASS or FAIL message.
   *
   * @param {string} name - Description of the test.
   * @param {Function} testFunction - Async function to test.
   */
  async function runTest(name, testFunction) {
    try {
      // Execute the test and wait until it finishes.
      await testFunction();

      // Display success only if no assertion failed.
      console.log(`PASS — ${name}`);
    } catch (error) {
      // Display unexpected errors and failed assertions.
      console.error(`FAIL — ${name}`, error);
    }
  }

  /* ========== 03. GET REQUEST TESTS ========== */

  // Test 1 — Retrieve all blog posts.
  await runTest("Fetch all posts", async () => {
    const posts = await fetchPosts();

    // Confirm that the result is a non-empty array.
    if (!Array.isArray(posts) || posts.length === 0) {
      throw new Error("Expected a non-empty posts array.");
    }

    console.log("Total posts:", posts.length);
    console.table(posts.slice(0, 3));
  });

  // Test 2 — Retrieve one post by ID.
  await runTest("Fetch post ID 5", async () => {
    const post = await fetchPostById(5);

    // Verify that the API returned the requested post.
    if (post.id !== 5) {
      throw new Error("Expected post ID 5.");
    }

    console.log("Post:", post.title);
  });

  // Test 3 — Retrieve comments belonging to post 1.
  await runTest("Fetch comments for post 1", async () => {
    const comments = await fetchCommentsByPostId(1);

    // Verify that the response contains an array.
    if (!Array.isArray(comments)) {
      throw new Error("Expected a comments array.");
    }

    // Verify that every returned comment belongs to post 1.
    if (!comments.every((comment) => comment.postId === 1)) {
      throw new Error("Some comments belong to another post.");
    }

    console.log("Total comments:", comments.length);
    console.table(comments.slice(0, 3));
  });

  /* ========== 04. EMPTY RESULT TESTS ========== */

  // Test 4 — A post can have zero comments.
  await runTest("Handle empty comments array", async () => {
    const comments = await fetchCommentsByPostId(5);

    // An empty array is valid; it is not an API error.
    if (!Array.isArray(comments)) {
      throw new Error("Expected a comments array.");
    }

    console.log("Comments returned:", comments.length);
  });

  /* ========== 05. HTTP ERROR TESTS ========== */

  // Test 5 — Request a nonexistent post.
  await runTest("Handle HTTP 404 for posts", async () => {
    try {
      await fetchPostById(999999);
    } catch (error) {
      // Confirm that the expected HTTP status was reported.
      if (error.message.includes("HTTP 404")) {
        return;
      }

      // An unexpected error should fail this test.
      throw error;
    }

    // Reaching this line means no error was thrown.
    throw new Error("Expected HTTP 404, but request succeeded.");
  });

  // Test 6 — Request comments for a nonexistent post.
  await runTest("Handle HTTP 404 for comments", async () => {
    try {
      await fetchCommentsByPostId(999999);
    } catch (error) {
      if (error.message.includes("HTTP 404")) {
        return;
      }

      throw error;
    }

    throw new Error("Expected HTTP 404, but request succeeded.");
  });

  /* ========== 06. INPUT VALIDATION TESTS ========== */

  // Test 7 — Reject a negative post ID.
  await runTest("Reject negative post ID", async () => {
    try {
      await fetchPostById(-5);
    } catch (error) {
      if (error instanceof TypeError) {
        return;
      }

      throw error;
    }

    throw new Error("Expected a TypeError for negative ID.");
  });

  // Test 8 — Reject a decimal post ID.
  await runTest("Reject decimal post ID", async () => {
    try {
      await fetchPostById(2.5);
    } catch (error) {
      if (error instanceof TypeError) {
        return;
      }

      throw error;
    }

    throw new Error("Expected a TypeError for decimal ID.");
  });

  // Test 9 — Reject an invalid comments post ID.
  await runTest("Reject invalid comments post ID", async () => {
    try {
      await fetchCommentsByPostId(-1);
    } catch (error) {
      if (error instanceof TypeError) {
        return;
      }

      throw error;
    }

    throw new Error("Expected a TypeError for invalid ID.");
  });

  /* ========== 07. NETWORK FAILURE DEMONSTRATION ========== */

  /*
   * Test 10:
   * Demonstrate that a rejected fetch() call throws.
   *
   * This tests native fetch(), not the private apiRequest()
   * helper in api.js.
   */
  await runTest("Native fetch rejection", async () => {
    try {
      // Chrome normally blocks requests to this restricted port.
      await fetch("http://127.0.0.1:1/");
    } catch (error) {
      if (error instanceof TypeError) {
        return;
      }

      throw error;
    }

    throw new Error("Expected fetch() to reject.");
  });

  /* ========== 08. TESTS FINISHED ========== */

  console.log("All manual API tests have finished.");
})();
