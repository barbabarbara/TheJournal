/* ========== THE JOURNAL — HOMEPAGE ========== */

/* 
app.js has four main responsibilities:
    1. Find elements that already exist in index.html.
    2. Create article cards dynamically using data from DummyJSON.
    3. Decide how many articles should be displayed.
    4. Handle loading, errors, empty results, and button clicks.
 */

// Import the existing API function.
import { fetchPosts } from "./api.js";
import { truncateText } from "./utils.js";

/* ========== 01. DOM ELEMENTS ========== */

// Find the container where article cards will appear.
const postsGrid = document.querySelector("#posts-grid");

// Find the element displaying the number of articles.
const resultCount = document.querySelector("#result-count");

const pagination = document.querySelector("#pagination");
const prevPageButton = document.querySelector("#prev-page");
const nextPageButton = document.querySelector("#next-page");
const pageInfo = document.querySelector("#page-info");

/* ----- Loading, error and empty-state elements ----- */

// Displays a message if the API request fails.
const errorBox = document.querySelector("#feed-error");

// Contains the readable error message.
const errorMessage = document.querySelector("#feed-error-message");

// Allows the user to retry a failed request.
const retryButton = document.querySelector("#retry-feed");

// Displays a message if no articles are available.
const emptyState = document.querySelector("#empty-state");

const PAGE_SIZE = 9;
const MAX_EXCERPT_LENGTH = 175;

let allPosts = [];
let currentPage = 1;

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

  // Display the article ID with leading zeroes.
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

  // Display up to three tags.
  for (const tag of (post.tags ?? []).slice(0, 3)) {
    const tagElement = document.createElement("span");
    tagElement.className = "tag";
    tagElement.textContent = tag;

    tagList.append(tagElement);
  }

  // Create a link to the full article.
  const titleLink = document.createElement("a");
  titleLink.className = "card-title-link";
  titleLink.href = `./post.html?id=${post.id}`;

  // Create the article heading.
  const title = document.createElement("h3");
  title.className = "card-title";
  title.textContent = post.title;

  titleLink.append(title);

  // Create an article preview using our reusable utility.
  const excerpt = document.createElement("p");
  excerpt.className = "card-excerpt";
  excerpt.textContent = truncateText(post.body, MAX_EXCERPT_LENGTH);

  // Assemble the main content.
  cardMain.append(tagList, titleLink, excerpt);

  /* ----- Article metadata ----- */

  const cardMeta = document.createElement("div");
  cardMeta.className = "card-meta";

  // Display article views, defaulting to zero when missing.
  const views = document.createElement("span");
  views.textContent = `◉ ${post.views ?? 0} views`;

  // Display article likes, defaulting to zero when missing.
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

/* ========== 03. RENDER ARTICLES ========== */

/**
 * Display one page of articles.
 *
 * @returns {void}
 */
function renderPosts() {
  // Calculate the total number of pages.
  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);

  // Calculate the first article's index.
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  // Select only the articles for the current page.
  const visiblePosts = allPosts.slice(startIndex, startIndex + PAGE_SIZE);

  // Create a temporary container for the article cards.
  const fragment = document.createDocumentFragment();

  for (const post of visiblePosts) {
    fragment.append(createPostCard(post));
  }

  // Replace the previous page's article cards.
  postsGrid.replaceChildren(fragment);

  // Display the empty state if no articles exist.
  emptyState.hidden = allPosts.length > 0;

  // Update the number of displayed articles.
  if (allPosts.length === 0) {
    resultCount.textContent = "No stories available.";
  } else {
    const first = startIndex + 1;
    const last = startIndex + visiblePosts.length;

    resultCount.textContent = `Showing ${first}–${last} of ${allPosts.length} stories.`;
  }

  // Update the pagination information.
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

  // Disable navigation buttons when appropriate.
  prevPageButton.disabled = currentPage === 1;
  nextPageButton.disabled = currentPage >= totalPages;

  // Hide pagination if there is only one page or no articles.
  pagination.hidden = totalPages <= 1;
}

/* ========== 04. LOAD ARTICLES ========== */

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
  pagination.hidden = true;

  // Indicate that the article list is loading.
  postsGrid.setAttribute("aria-busy", "true");
  resultCount.textContent = "Loading stories…";

  // Prevent repeated clicks during the request.
  retryButton.disabled = true;

  try {
    /* ----- Successful request ----- */

    // Fetch all articles from DummyJSON.
    allPosts = await fetchPosts();

    currentPage = 1;

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
    pagination.hidden = true;

    resultCount.textContent = "Could not load stories.";
  } finally {
    /* ----- Always runs ----- */

    // The request has finished, whether successful or not.
    postsGrid.setAttribute("aria-busy", "false");

    // Re-enable the retry button.
    retryButton.disabled = false;
  }
}

/* ========== 05. EVENT LISTENERS ========== */

// Display the previous page.
prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPosts();
    resultCount.scrollIntoView({ behavior: "smooth" });
  }
});

// Display the next page.
nextPageButton.addEventListener("click", () => {
  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);

  if (currentPage < totalPages) {
    currentPage++;
    renderPosts();
    resultCount.scrollIntoView({ behavior: "smooth" });
  }
});

// Retry loading articles when the user clicks "Try again".
retryButton.addEventListener("click", loadPosts);

/* ========== 06. INITIALIZATION ========== */

// Load articles when the homepage module runs.
loadPosts();
