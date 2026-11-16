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
import { findArticleImage } from "./article-images.js";
import { truncateText } from "./utils.js";

/* ========== 01. DOM ELEMENTS ========== */

// Find the container where article cards will appear.
const postsGrid = document.querySelector("#posts-grid");
const featuredPost = document.querySelector("#featured-post");

// Find the element displaying the number of articles.
const resultCount = document.querySelector("#result-count");

const pagination = document.querySelector("#pagination");
const prevPageButton = document.querySelector("#prev-page");
const nextPageButton = document.querySelector("#next-page");
const pageInfo = document.querySelector("#page-info");
const pageNumbers = document.querySelector("#page-numbers");
const pageJumpForm = document.querySelector("#page-jump-form");
const pageJumpInput = document.querySelector("#page-jump-input");

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

/* ========== IMAGES ONLY — NO CHANGE TO SITE DESIGN ========== */

/**
 * Add a picture to a story card only if its generated local file exists.
 * Otherwise, the text-only card keeps the original appearance.
 */
function createPostPicture(post) {
  const link = document.createElement("a");
  link.className = "card-picture-link";
  link.href = `./post.html?id=${post.id}`;
  link.setAttribute("aria-label", `Read ${post.title}`);
  link.hidden = true;

  const image = document.createElement("img");
  image.className = "card-picture";
  image.alt = `Illustration for ${post.title}`;
  image.loading = "eager";
  image.decoding = "async";
  image.addEventListener("load", () => {
    link.append(image);
    link.hidden = false;
  });
  image.addEventListener("error", () => {
    link.hidden = true;
  });

  void findArticleImage(post)
    .then((picture) => {
      image.alt = picture.alt;
      image.src = picture.src;
    })
    .catch(() => {
      link.hidden = true;
    });

  return link;
}

/**
 * Put a generated picture in the EXISTING featured artwork area.
 * The original decorative artwork remains whenever no picture exists.
 */
function showFeaturedPicture(post) {
  if (!featuredPost || !post) return;
  const visual = featuredPost.querySelector(".featured-visual");
  if (!visual) return;

  visual.querySelector(".featured-picture")?.remove();
  visual.classList.remove("has-generated-picture");

  const picture = document.createElement("img");
  picture.className = "featured-picture";
  picture.alt = "";
  picture.loading = "eager";
  picture.decoding = "async";
  picture.addEventListener("load", () => {
    visual.classList.add("has-generated-picture");
  });
  picture.addEventListener("error", () => {
    picture.remove();
    visual.classList.remove("has-generated-picture");
  });
  visual.append(picture);

  void findArticleImage(post)
    .then(({ src }) => {
      picture.src = src;
    })
    .catch(() => picture.remove());
}

/** Fill the existing featured preview so its picture matches the story. */
function renderFeaturedStory(posts) {
  if (!featuredPost || posts.length === 0) return;
  const featured = [...posts].sort(
    (a, b) => (b.views ?? 0) - (a.views ?? 0),
  )[0];
  const content = featuredPost.querySelector(".featured-content");
  if (!content) return;

  content.querySelector(".featured-kicker").textContent =
    "EDITOR’S PICK · FEATURED STORY";
  const tags = content.querySelector(".tag-list");
  const tagElements = (featured.tags ?? []).slice(0, 3).map((tag) => {
    const element = document.createElement("span");
    element.className = "tag";
    element.textContent = tag;
    return element;
  });
  tags.replaceChildren(...tagElements);

  const title = content.querySelector(".featured-title");
  const link = document.createElement("a");
  link.href = `./post.html?id=${featured.id}`;
  link.textContent = featured.title;
  title.replaceChildren(link);
  content.querySelector(".featured-description").textContent = truncateText(
    featured.body,
    240,
  );
  content.querySelector(".featured-meta").textContent =
    `${featured.views ?? 0} views · ${featured.reactions?.likes ?? 0} likes`;
  showFeaturedPicture(featured);
}

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

  article.append(
    cardTop,
    createPostPicture(post),
    cardMain,
    cardMeta,
    cardActions,
  );

  return article;
}

// Navigate to a specific page.
function goToPage(page) {
  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);

  if (!Number.isInteger(page) || page < 1 || page > totalPages) {
    return;
  }

  currentPage = page;
  renderPosts();

  resultCount.scrollIntoView({
    behavior: "smooth",
  });
}

// Generate numbered pagination with ellipses.
function renderPageNumbers(totalPages) {
  const pages = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);

  const sortedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const fragment = document.createDocumentFragment();

  function addButton(page) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "page-number";
    button.textContent = String(page);
    button.setAttribute("aria-label", `Go to page ${page}`);

    if (page === currentPage) {
      button.classList.add("active");
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => goToPage(page));

    fragment.append(button);
  }

  let previous = 0;

  for (const page of sortedPages) {
    if (page - previous === 2) {
      addButton(previous + 1);
    } else if (page - previous > 2) {
      const dots = document.createElement("span");
      dots.className = "page-ellipsis";
      dots.textContent = "…";
      dots.setAttribute("aria-hidden", "true");
      fragment.append(dots);
    }

    addButton(page);
    previous = page;
  }

  pageNumbers.replaceChildren(fragment);
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
  renderPageNumbers(totalPages);

  pageJumpInput.max = String(totalPages);
  pageJumpInput.value = String(currentPage);

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

    // Update the original featured preview and render article cards.
    renderFeaturedStory(allPosts);
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

// Jump to a page entered by the user.
pageJumpForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const page = Number(pageJumpInput.value);

  if (!pageJumpInput.checkValidity()) {
    pageJumpInput.reportValidity();
    return;
  }

  goToPage(page);
});

/* ========== 06. INITIALIZATION ========== */

// Load articles when the homepage module runs.
loadPosts();
