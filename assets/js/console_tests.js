// Test 1 — Successful API request

(async () => {
  const { fetchPosts } = await import("./assets/js/api.js");

  const posts = await fetchPosts();

  console.log("Total posts:", posts.length);
  console.table(posts.slice(0, 3));
})();

// Test 2 — HTTP 404 error

(async () => {
  try {
    // Deliberately request a nonexistent endpoint.
    const response = await fetch(
      "https://dummyjson.com/this-endpoint-does-not-exist",
    );

    // Check the HTTP status, just like getJSON().
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log("Caught error:", error.message);
  }
})();

// Test 3 — Network failure

(async () => {
  try {
    await fetch("http://127.0.0.1:1/");
  } catch (error) {
    console.log("Network request failed.");
    console.log("Error type:", error.name);
  }
})();

// Test 4 — test fetchPostById

(async () => {
  // Import the new function from api.js.
  const { fetchPostById } = await import("./assets/js/api.js");

  // Retrieve the post with ID 5.
  const post = await fetchPostById(5);

  // Display the complete post.
  console.log("Post object:", post);

  // Display selected properties.
  console.log("ID:", post.id);
  console.log("Title:", post.title);
  console.log("Body:", post.body);
})();


// Test 5 - Request an invalid post ID

(async () => {
  const { fetchPostById } = await import("./assets/js/api.js");

  try {
    // Request a post that does not exist.
    const post = await fetchPostById(999999);

    console.log("Post:", post);
  } catch (error) {
    // Display the error thrown by getJSON().
    console.log("Caught error:", error.message);
  }
})();

// Test 6 - test fetchCommentsByPostId


(async () => {
  // Import our new comments API function.
  const { fetchCommentsByPostId } = await import(
    "./assets/js/api.js"
  );

  // Fetch comments belonging to post 1.
  const comments = await fetchCommentsByPostId(1);

  // Display how many comments were returned.
  console.log("Total comments:", comments.length);

  // Display the comments in a table.
  console.table(comments);

  // Display the first comment, if one exists.
  if (comments.length > 0) {
    console.log("First comment:", comments[0].body);
  }
})();


// Test 7 - Invlid ID


(async () => {
  const { fetchCommentsByPostId } = await import(
    "./assets/js/api.js"
  );

  try {
    // Request comments for a nonexistent post.
    const comments = await fetchCommentsByPostId(999999);

    console.log("Comments:", comments);
  } catch (error) {
    // Display the error if the API rejects the request.
    console.log("Caught error:", error.message);
  }
})();
