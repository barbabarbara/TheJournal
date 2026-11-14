# The Journal — Stories & Perspectives

An editorial blog with a clean, modern white-and-cool-grey design, built with **semantic HTML, one CSS stylesheet, and vanilla JavaScript**. It uses [DummyJSON](https://dummyjson.com/) for real sample posts and comments.

**The Journal does not invent or substitute blog articles.** Post titles, article bodies, and tags come directly from the API. The editorial hero text and background photograph are static website branding, not API posts.

## Features

| Assignment | Implementation |
|---|---|
| GET: at least 10 posts | Requests all available posts; renders 12 at a time with **Load more** |
| Dedicated page | `post.html?id=123` displays the selected post |
| GET comments | Requests `/comments/post/:id?limit=0` |
| POST comment | Shows a comment only after a successful API response |
| PUT / PATCH | Edit title and body (and optional tags) using a selectable method |
| DELETE | Delete with confirmation and visible status |
| Error handling | Shared `fetch()` helper checks `response.ok` and uses `try/catch`; errors appear on the page |
| VG: search | Searches titles, text, and tags |
| VG: tags | Populates tag options from fetched data |
| VG: sort | Sorts by views, likes, title, or descending post ID (not publication date) |
| Responsive | Layout rules for phones, tablets, and desktops |

### Important: DummyJSON is a simulated API

**POST, PUT, PATCH, and DELETE do not permanently change DummyJSON's database.** After successful API operations, this project stores edits, deleted post IDs, and new comments in **your browser's `localStorage`**. They persist across refreshes in the same browser, but they are **not shared between different visitors**. Select **Reset demo data** to clear them.

## Folder structure

```text
TheJournalBlog/
├── index.html                    # Homepage and article overview
├── post.html                     # Dedicated post and comment page
├── TASK.md                       # Assignment brief
├── README.md
├── .gitignore
├── package.json                 # Test command only, no runtime dependencies
├── assets/
│   ├── css/
│   │   └── styles.css           # All website styles, one file
│   ├── icons/
│   │   └── favicon.svg          # Scalable browser-tab icon
│   ├── images/
│   │   └── editorial-magazine.webp
│   └── js/
│       ├── api.js               # All GET/POST/PUT/PATCH/DELETE requests
│       ├── app.js               # Homepage DOM rendering and filters
│       ├── post.js              # Post detail, editor, comments, delete
│       ├── common.js            # Shared components, alerts, toast messages
│       ├── storage.js           # Browser persistence for simulated writes
│       └── utils.js             # Pure, testable filtering/sorting utilities
└── tests/
    ├── api.test.mjs
    ├── utils.test.mjs
    └── structure.test.mjs
```

## Navigation and design

Both pages use consistent **Home, Stories, About** navigation. The **Stories** link keeps the reference design’s dark rounded call-to-action style. All three links remain accessible on narrow screens.

The default sort uses **descending post ID**, not a publication timestamp (DummyJSON post objects do not supply reliable publication dates).

## Run locally

Open the folder in **Visual Studio Code**, then right-click `index.html` and choose **Open with Live Server**. Alternatively, start a local server:

```bash
python -m http.server 5500
```

Visit `http://localhost:5500/`. Opening the HTML file directly from `file://` is not recommended because JavaScript modules require an HTTP server in most browsers.

An internet connection is needed to retrieve posts and comments from DummyJSON and to load Google Fonts.

## CSS structure

There is **one CSS file** shared by both pages. Its sections are organized by responsibility:

1. Design tokens, reset, and typography
2. Header and navigation
3. Buttons and homepage hero
4. Featured story
5. Search, filters, and article cards
6. About and footer
7. Article details
8. Editor and comments
9. Feedback and notifications
10–13. Responsive breakpoints and reduced-motion support

The HTML contains semantic sections and the IDs consumed by the JavaScript. Avoid renaming IDs such as `posts-grid`, `featured-post`, `post-article`, `edit-form`, and `comments-list` without updating the corresponding JavaScript.

## REST API endpoints

| HTTP method | Endpoint | Use |
|---|---|---|
| GET | `https://dummyjson.com/posts?limit=0` | List posts |
| GET | `https://dummyjson.com/posts/:id` | One post |
| GET | `https://dummyjson.com/comments/post/:id?limit=0` | Comments for a post |
| POST | `https://dummyjson.com/comments/add` | Submit a comment |
| PUT | `https://dummyjson.com/posts/:id` | Full post update request |
| PATCH | `https://dummyjson.com/posts/:id` | Partial post update request |
| DELETE | `https://dummyjson.com/posts/:id` | Remove post request |

All requests run through the shared `apiRequest()` function in `assets/js/api.js`, which catches errors and checks HTTP status with `response.ok`.

## Testing

With Node.js installed, run the automated regression suite (26 tests):

```bash
npm test
```

Also check these browser scenarios manually before submitting:

- Load the homepage and verify 12 posts are displayed initially.
- Open a post and check its ID, content, and comments.
- Add a comment, refresh, and verify it is still visible in this browser.
- Edit a post using both PUT and PATCH; refresh to check persistence.
- Delete a post; return to the homepage and verify it is no longer listed.
- Try search, tag filtering, sorting, load-more, clear filters, and reset.
- Simulate a failed API request (DevTools → Network → Offline) and check the visible error message.
- Check desktop, tablet, and phone widths, including a narrow 320px viewport.

## Publish on GitHub Pages

This project is plain HTML/CSS/JavaScript — no build step is required.

1. Commit and push the contents of the project to your GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, then `main` and `/ (root)`.
4. Open the GitHub Pages URL and repeat the browser checks above with the live DummyJSON API.
5. Submit both your GitHub repository URL and GitHub Pages URL.

The site uses a static-hosting-friendly detail route, `post.html?id=123`, rather than requiring a server-side `/posts/123` route.

### Search engine indexing

Both HTML pages include `<meta name="robots" content="noindex">` because this is a student demo. This asks search engines not to index the pages, but **does not make the site private**. Your teacher can still access it using the public link.
