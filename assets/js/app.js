/* ========== THE JOURNAL — HOMEPAGE ========== */

// Import the existing API function.
import { fetchPosts } from "./api.js";

/* ========== 01. DOM ELEMENTS ========== */

// Find the container where article cards will appear.
const postsGrid = document.querySelector("#posts-grid");

// Find the element displaying the number of articles.
const resultCount = document.querySelector("#result-count");

// Find the "Load more" button.
const loadMoreButton = document.querySelector("#load-more");

/* ----- Loading, error and empty-state elements ----- */

// Displays a message if the API request fails.
const errorBox = document.querySelector("#feed-error");

// Contains the readable error message.
const errorMessage = document.querySelector("#feed-error-message");

// Allows the user to retry a failed request.
const retryButton = document.querySelector("#retry-feed");

// Displays a message if no articles are available.
const emptyState = document.querySelector("#empty-state");

const PAGE_SIZE = 12;

let allPosts = [];
let visibleCount = PAGE_SIZE;

/* ========== 02. CREATE ARTICLE CARD ========== */

/**
 * Create an article card using data from DummyJSON.
 *
 * @param {Object} post - An article returned by the API.
 * @returns {HTMLElement} The completed article element.
 */
function createPostCard(post) {
  // Create the outer article element.
  const article = document.createElement("article");
  article.className = "post-card";

  /* ----- Card header ----- */

  const cardTop = document.createElement("div");
  cardTop.className = "card-top";

  // Display the article ID.
  const cardNumber = document.createElement("span");
  cardNumber.className = "card-number";
  cardNumber.textContent = `STORY / ${String(post.id).padStart(3, "0")}`;

  // Add a decorative arrow.
  const cardArrow = document.createElement("span");
  cardArrow.className = "card-arrow";
  cardArrow.textContent = "↗";
  cardArrow.setAttribute("aria-hidden", "true");

  cardTop.append(cardNumber, cardArrow);

  /* ----- Main content ----- */

  const cardMain = document.createElement("div");
  cardMain.className = "card-main";

  // Create the tag container.
  const tagList = document.createElement("div");
  tagList.className = "tag-list";

  // Display up to two tags for a compact card.
  for (const tag of (post.tags ?? []).slice(0, 2)) {
    const tagElement = document.createElement("span");
    tagElement.className = "tag";
    tagElement.textContent = tag;

    tagList.append(tagElement);
  }

  // Create the article link.
  const titleLink = document.createElement("a");
  titleLink.className = "card-title-link";
  titleLink.href = `./post.html?id=${post.id}`;

  // Create the article heading.
  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = post.title;

  titleLink.append(title);

  // Create a shorter article preview.
  const excerpt = document.createElement("p");
  excerpt.className = "card-excerpt";

  const maxExcerptLength = 175;

  const shortBody =
    post.body.length > maxExcerptLength
      ? `${post.body.slice(0, maxExcerptLength).trimEnd()}…`
      : post.body;

  excerpt.textContent = shortBody;

  // Assemble the main content.
  cardMain.append(tagList, titleLink, excerpt);

  /* ----- Article metadata ----- */

  const cardMeta = document.createElement("div");
  cardMeta.className = "card-meta";

  // Display article views.
  const views = document.createElement("span");
  views.textContent = `◉ ${post.views ?? 0} views`;

  // Display article likes.
  const likes = document.createElement("span");
  likes.textContent = `♥ ${post.reactions?.likes ?? 0} likes`;

  cardMeta.append(views, likes);

  /* ----- Card actions ----- */

  const cardActions = document.createElement("div");
  cardActions.className = "card-actions";

  // Link to the full article page.
  const readLink = document.createElement("a");
  readLink.className = "card-read";
  readLink.href = `./post.html?id=${post.id}`;
  readLink.textContent = "Read story ↗";

  cardActions.append(readLink);

  /* ----- Assemble the complete card ----- */

  article.append(cardTop, cardMain, cardMeta, cardActions);

  return article;
}

/* ========== 03. LOAD ARTICLES ========== */

/**
 * Render the currently visible articles.
 *
 * Displays the empty state when no articles are available.
 *
 * @returns {void}
 */
function renderPosts() {
  // Select up to the requested number of articles.
  const visiblePosts = allPosts.slice(0, visibleCount);

  // Create a temporary container for article cards.
  const fragment = document.createDocumentFragment();

  // Create one card for each visible article.
  for (const post of visiblePosts) {
    fragment.append(createPostCard(post));
  }

  // Replace the previous cards with the new selection.
  postsGrid.replaceChildren(fragment);

  // Announce that rendering is complete.
  postsGrid.setAttribute("aria-busy", "false");

  // Display the empty state only when there are no posts.
  emptyState.hidden = allPosts.length > 0;

  // Update the accessible result count.
  if (allPosts.length === 0) {
    resultCount.textContent = "No stories available.";
  } else {
    resultCount.textContent = `Showing ${visiblePosts.length} of ${allPosts.length} stories.`;
  }

  // Hide the button when no additional articles remain.
  loadMoreButton.hidden = visiblePosts.length >= allPosts.length;
}

/**
 * Fetch articles and update loading, error and empty states.
 *
 * @returns {Promise<void>}
 */
async function loadPosts() {
  // Prevent duplicate requests while loading.
  if (postsGrid.getAttribute("aria-busy") === "true") {
    return;
  }

  /* ----- Loading state ----- */

  // Hide old error and empty-state messages.
  errorBox.hidden = true;
  emptyState.hidden = true;
  loadMoreButton.hidden = true;

  // Indicate that the article list is loading.
  postsGrid.setAttribute("aria-busy", "true");
  resultCount.textContent = "Loading stories…";

  // Prevent repeated clicks during the request.
  retryButton.disabled = true;

  try {
    /* ----- Successful request ----- */

    // Fetch all articles from DummyJSON.
    allPosts = await fetchPosts();

    // Reset pagination to the first 12 articles.
    visibleCount = PAGE_SIZE;

    // Render the posts or the empty state.
    renderPosts();
  } catch (error) {
    /* ----- Failed request ----- */

    // Keep the technical error available for debugging.
    console.error("Failed to load posts:", error);

    // Remove any previously displayed articles.
    allPosts = [];
    postsGrid.replaceChildren();

    // Display an understandable error message.
    errorMessage.textContent = "Unable to load stories. Please try again.";

    errorBox.hidden = false;
    emptyState.hidden = true;
    loadMoreButton.hidden = true;

    resultCount.textContent = "Could not load stories.";
  } finally {
    /* ----- Always runs ----- */

    // The request has finished, whether successful or not.
    postsGrid.setAttribute("aria-busy", "false");

    // Re-enable the retry button.
    retryButton.disabled = false;
  }
}

// Load 12 more articles when the button is clicked.
loadMoreButton.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderPosts();
});

// Retry loading articles when the user clicks "Try again".
retryButton.addEventListener("click", loadPosts);

/* ========== 04. INITIALIZATION ========== */

// Load articles when the homepage module runs.
loadPosts();
