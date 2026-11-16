/* ========== THE JOURNAL — INDIVIDUAL ARTICLE (M6) ========== */

/*
post.js has four responsibilities:
  1. Read and validate the article ID in the page URL.
  2. Load and safely render the complete article.
  3. Load and safely render comments for that article only.
  4. Handle missing articles, loading states, and retry actions.

Editing, deletion, and posting comments belong to later milestones.
*/

// Reuse the tested API service rather than calling fetch() here.
import { fetchCommentsByPostId, fetchPostById } from "./api.js";
import { DEFAULT_ARTICLE_IMAGE, findArticleImage } from "./article-images.js";
import { getRelatedTopics } from "./article-topics.js";

/* ========== 01. DOM ELEMENTS ========== */

const article = document.querySelector("#post-article");
const articleVisual = document.querySelector(".article-visual");
const imageCredit = document.querySelector("#post-image-credit");
const postNumber = document.querySelector("#post-number");
const postTitle = document.querySelector("#post-title");
const postMeta = document.querySelector("#post-meta");
const postStatus = document.querySelector("#post-status");
const postContent = document.querySelector("#post-content");
const postTags = document.querySelector("#post-tags");
const relatedTopics = document.querySelector("#related-topics");
const relatedTopicsSection = document.querySelector("#related-topics-section");
const postFooter = document.querySelector("#post-footer");

const postError = document.querySelector("#post-error");
const postErrorMessage = document.querySelector("#post-error-message");
const retryPostButton = document.querySelector("#retry-post");

const commentsSection = document.querySelector("#comments");
const commentsList = document.querySelector("#comments-list");
const commentsCount = document.querySelector("#comments-count");
const commentsError = document.querySelector("#comments-error");
const commentsErrorMessage = document.querySelector("#comments-error-message");
const retryCommentsButton = document.querySelector("#retry-comments");

/* ========== 02. READ AND VALIDATE THE POST ID ========== */

/**
 * Return a positive, safe integer from ?id=12.
 * Reject missing IDs, duplicate IDs, decimals, spaces, and non-numbers.
 *
 * @returns {number|null} A valid post ID or null.
 */
function getPostId() {
  const params = new URLSearchParams(window.location.search);
  const ids = params.getAll("id");

  // Exactly one ID is required. The first digit cannot be zero.
  if (ids.length !== 1 || !/^[1-9]\d*$/.test(ids[0])) {
    return null;
  }

  const id = Number(ids[0]);
  return Number.isSafeInteger(id) ? id : null;
}

// Read this once. Clicking Retry must request the same article.
const postId = getPostId();

/* ========== 03. CREATE SAFE DOM ELEMENTS ========== */

/**
 * Create a DOM element and insert plain text safely.
 * API text must never be interpreted as HTML.
 *
 * @param {string} tagName - HTML element name.
 * @param {string} className - Optional CSS class.
 * @param {string} text - Optional text content.
 * @returns {HTMLElement} The newly created element.
 */
function createElement(tagName, className = "", text = "") {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

/**
 * Display a message when the article cannot be loaded.
 * The Retry button is hidden for permanent invalid/404 IDs.
 *
 * @param {string} message - Accessible error message.
 * @param {boolean} canRetry - Whether another request may help.
 */
function showPostError(message, canRetry = false) {
  article.setAttribute("aria-busy", "false");
  article.hidden = true;
  commentsSection.hidden = true;
  postErrorMessage.textContent = message;
  postError.hidden = false;
  retryPostButton.hidden = !canRetry;
  retryPostButton.disabled = false;
  document.title = "Story unavailable | The Journal";
}

/* ========== 04. ARTICLE PHOTOGRAPH ========== */

// Prevent an old image request from updating a newly rendered story.
let imageRequestId = 0;

/** Display the selected photograph’s source, without inserting HTML. */
function showImageCredit(photo) {
  if (!photo.source) {
    imageCredit.replaceChildren();
    imageCredit.hidden = true;
    return;
  }

  const link = document.createElement("a");
  link.href = photo.source;
  link.textContent = photo.sourceLabel ?? "View photograph";
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  imageCredit.replaceChildren(
    document.createTextNode(
      `Illustrative photo: ${photo.creator} · ${photo.license} · `,
    ),
    link,
  );
  imageCredit.hidden = false;
}

/**
 * Display a subject-matched photograph in the existing article window.
 * When an external image fails, display the project's local image instead.
 * Image loading must never interrupt article or comment rendering.
 */
async function renderArticlePhoto(post) {
  const requestId = ++imageRequestId;

  articleVisual.querySelector(".article-visual-image")?.remove();
  articleVisual.classList.remove("has-image");
  imageCredit.replaceChildren();
  imageCredit.hidden = true;

  try {
    const photo = await findArticleImage(post);
    if (requestId !== imageRequestId) return;

    const image = document.createElement("img");
    image.className = "article-visual-image";
    image.alt = ""; // Decorative illustration; story text provides context.
    image.loading = "eager"; // The photo is near the top of the page.
    image.decoding = "async";

    let usingLocalFallback = photo.src === DEFAULT_ARTICLE_IMAGE;

    image.addEventListener("load", () => {
      if (requestId !== imageRequestId) return;
      articleVisual.classList.add("has-image");
      showImageCredit(usingLocalFallback ? { source: null } : photo);
    });

    image.addEventListener("error", () => {
      if (requestId !== imageRequestId) return;

      if (!usingLocalFallback) {
        // A broken photo URL must not leave the grey illustration empty.
        usingLocalFallback = true;
        image.src = DEFAULT_ARTICLE_IMAGE;
      } else {
        // Only needed if the local asset itself has been removed.
        image.remove();
        articleVisual.classList.remove("has-image");
      }
    });

    articleVisual.append(image);
    image.src = photo.src;
  } catch (error) {
    console.info("Illustrative photo unavailable:", error.message);
  }
}

/* ========== 05. RENDER THE FULL ARTICLE ========== */

/**
 * Replace the design placeholders with the selected API article.
 *
 * @param {Object} post - Article returned by DummyJSON.
 */
function renderArticle(post) {
  postNumber.textContent = `STORY / ${String(post.id).padStart(3, "0")}`;
  postTitle.textContent = post.title;

  // Search for a relevant photograph; continue rendering immediately.
  void renderArticlePhoto(post);

  // Display a real author ID; DummyJSON posts don't include author names.
  const authorId = post.userId ?? "unknown";
  const authorBadge = createElement(
    "span",
    "author-badge",
    String(authorId).slice(0, 2).toUpperCase(),
  );
  authorBadge.setAttribute("aria-hidden", "true");

  const author = createElement("span", "meta-author", `Author #${authorId}`);
  const dot1 = createElement("span", "meta-dot", "·");
  dot1.setAttribute("aria-hidden", "true");
  const views = createElement("span", "", `${post.views ?? 0} views`);
  const dot2 = createElement("span", "meta-dot", "·");
  dot2.setAttribute("aria-hidden", "true");
  const likes = createElement(
    "span",
    "",
    `♥ ${post.reactions?.likes ?? 0} likes`,
  );
  postMeta.replaceChildren(authorBadge, author, dot1, views, dot2, likes);
  postMeta.hidden = false;

  // Never truncate the article body on the details page.
  // If the API includes blank lines, preserve them as paragraphs.
  const paragraphs = post.body.split(/\n\s*\n/);
  const fragment = document.createDocumentFragment();

  for (const paragraph of paragraphs) {
    if (paragraph.trim()) {
      fragment.append(createElement("p", "article-body", paragraph.trim()));
    }
  }
  postContent.replaceChildren(fragment);

  // Show all article tags, not just the first three used on the homepage.
  const tagFragment = document.createDocumentFragment();
  for (const tag of Array.isArray(post.tags) ? post.tags : []) {
    tagFragment.append(createElement("span", "tag", tag));
  }
  postTags.replaceChildren(tagFragment);

  // Add extra, clearly identified topics inferred from the article.
  // Do not present these as original DummyJSON tags.
  const topics = getRelatedTopics(post);
  const topicFragment = document.createDocumentFragment();
  for (const topic of topics) {
    topicFragment.append(createElement("span", "tag topic-tag", topic));
  }
  relatedTopics.replaceChildren(topicFragment);
  relatedTopicsSection.hidden = topics.length === 0;
  postFooter.hidden = false;

  // Remove the loading message after the article is ready.
  postStatus.hidden = true;
  article.setAttribute("aria-busy", "false");
  document.title = `${post.title} | The Journal`;
}

/* ========== 06. RENDER MATCHING COMMENTS ========== */

/**
 * Create one safe comment card, matching the existing CSS design.
 *
 * @param {Object} comment - Comment returned by DummyJSON.
 * @returns {HTMLElement} The completed comment element.
 */
function createCommentCard(comment) {
  const card = createElement("article", "comment");
  const name = comment.user?.fullName || comment.user?.username || "Anonymous";

  const avatar = createElement(
    "span",
    "comment-avatar",
    String(name).slice(0, 1).toUpperCase(),
  );
  avatar.setAttribute("aria-hidden", "true");

  const content = createElement("div", "comment-content");
  const top = createElement("div", "comment-top");
  top.append(createElement("h3", "comment-author", name));

  const body = createElement("p", "comment-text", comment.body ?? "");
  const likes = createElement(
    "span",
    "comment-likes",
    `♥ ${comment.likes ?? 0} likes`,
  );

  content.append(top, body, likes);
  card.append(avatar, content);
  return card;
}

/**
 * Display the API comments, or an explicit empty state.
 *
 * @param {Array} comments - Comments for the current post.
 */
function renderComments(comments) {
  commentsCount.textContent = `(${comments.length})`;

  if (comments.length === 0) {
    commentsList.replaceChildren(
      createElement("p", "loading-copy", "No comments yet on this story."),
    );
  } else {
    const fragment = document.createDocumentFragment();
    for (const comment of comments) {
      fragment.append(createCommentCard(comment));
    }
    commentsList.replaceChildren(fragment);
  }

  commentsList.setAttribute("aria-busy", "false");
}

/* ========== 07. LOAD COMMENTS ========== */

/**
 * Load comments separately; a comment error must not hide the article.
 *
 * @returns {Promise<void>}
 */
async function loadComments() {
  if (commentsList.getAttribute("aria-busy") === "true") return;

  commentsError.hidden = true;
  retryCommentsButton.disabled = true;
  commentsList.setAttribute("aria-busy", "true");
  commentsList.replaceChildren(
    createElement("p", "loading-copy", "Loading comments…"),
  );
  commentsCount.textContent = "";

  try {
    const allComments = await fetchCommentsByPostId(postId);

    // Be defensive: never show comments from a different article.
    const matchingComments = allComments.filter(
      (comment) => comment?.postId === postId,
    );
    renderComments(matchingComments);
  } catch (error) {
    commentsList.replaceChildren(
      createElement("p", "loading-copy", "Comments could not be loaded."),
    );
    commentsErrorMessage.textContent =
      "Unable to load comments. Please try again.";
    commentsError.hidden = false;
  } finally {
    commentsList.setAttribute("aria-busy", "false");
    retryCommentsButton.disabled = false;
  }
}

/* ========== 08. LOAD ARTICLE ========== */

/**
 * Fetch the article. Comments load only if it succeeds.
 *
 * @returns {Promise<void>}
 */
async function loadPost() {
  if (postId === null) {
    showPostError("Missing or invalid story ID. Return to All Stories.");
    return;
  }

  if (article.getAttribute("aria-busy") === "true") return;

  article.hidden = false;
  postError.hidden = true;
  retryPostButton.disabled = true;
  commentsSection.hidden = true;

  article.setAttribute("aria-busy", "true");
  postNumber.textContent = "LOADING STORY";
  postTitle.textContent = "Loading story…";
  postStatus.hidden = false;
  postStatus.textContent = "Retrieving article details…";
  postMeta.hidden = true;
  postFooter.hidden = true;
  postContent.replaceChildren();

  try {
    const post = await fetchPostById(postId);

    // Protect the page from unexpected API data.
    if (
      !post ||
      post.id !== postId ||
      typeof post.title !== "string" ||
      typeof post.body !== "string"
    ) {
      throw new Error("The API returned invalid article data.");
    }

    renderArticle(post);
    commentsSection.hidden = false;

    // Run only after the article has been rendered.
    await loadComments();
  } catch (error) {
    if (/^HTTP 404\b/.test(error.message)) {
      showPostError("This story was not found (404). Select another story.");
    } else {
      showPostError("Unable to load this story. Please try again.", true);
      console.error("Could not load article:", error);
    }
  } finally {
    retryPostButton.disabled = false;
    article.setAttribute("aria-busy", "false");
  }
}

/* ========== 09. EVENTS & INITIALIZATION ========== */

retryPostButton.addEventListener("click", loadPost);
retryCommentsButton.addEventListener("click", loadComments);

// Start without a second server request when the URL is invalid.
// The static HTML has aria-busy="true" for its initial loading state.
article.setAttribute("aria-busy", "false");
commentsList.setAttribute("aria-busy", "false");
loadPost();
