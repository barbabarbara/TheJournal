# The Journal — Stories & Perspectives

A modern, responsive blog platform built with **HTML5, CSS3, and vanilla JavaScript**.

The Journal is a JavaScript coursework project focused on **semantic HTML**, **accessibility**, **responsive design**, and **REST API integration**. It will use the [DummyJSON REST API](https://dummyjson.com/) to display sample posts and comments.

## Technologies

- **HTML5** — Semantic page structure
- **CSS3** — Styling and responsive layouts
- **JavaScript** — Interactivity and API requests using `fetch()`
- **DummyJSON** — Sample blog posts and comments
- **Git and GitHub** — Version control and deployment

## Features

### Completed — Initial setup

- [x] Project folder structure
- [x] Basic semantic HTML structure
- [x] Responsive CSS foundation
- [x] Google Fonts (DM Sans and Manrope)
- [x] Website favicon linked in HTML
- [x] Header, navigation, and footer
- [x] Homepage sections
- [x] Basic keyboard accessibility styles and skip link

### Planned — Blog functionality

- [ ] Display at least 10 posts (GET)
- [ ] Provide a dedicated detail page for each post (`post.html?id=123`)
- [ ] Fetch and display comments for each post (GET)
- [ ] Add comments after successful API requests (POST)
- [ ] Edit post titles and bodies (PUT/PATCH)
- [ ] Delete posts with confirmation (DELETE)
- [ ] Search posts (VG)
- [ ] Filter posts by tags (VG)
- [ ] Sort posts by views or reactions (VG)
- [ ] Handle loading, empty, success, and error states in the UI
- [ ] Test responsiveness, accessibility, and functionality
- [ ] Deploy to GitHub Pages

## API

Documentation:

- [DummyJSON Posts](https://dummyjson.com/docs/posts)
- [DummyJSON Comments](https://dummyjson.com/docs/comments)

**Important:** DummyJSON simulates POST, PUT, PATCH, and DELETE operations; they do **not** permanently change its database. The planned implementation will save successful simulated changes in the browser's `localStorage`. These changes will persist in that browser but will not be shared between visitors.

## Folder Structure

```text
TheJournal/
├── index.html                  # Homepage and article overview
├── post.html                   # Individual post details (planned)
├── TASK.md                     # Assignment requirements
├── README.md                   # Project documentation
├── .gitignore                  # Git exclusions
├── package.json                # Test configuration (planned)
│
├── assets/
│   ├── css/
│   │   └── styles.css          # Main stylesheet
│   ├── icons/
│   │   └── favicon.svg         # Website favicon
│   ├── images/
│   │   └── editorial-magazine.webp
│   └── js/
│       ├── api.js              # REST API requests (planned)
│       ├── app.js              # Homepage functionality (planned)
│       ├── post.js             # Post details and comments (planned)
│       ├── common.js           # Shared UI functions (planned)
│       ├── storage.js          # Browser persistence (planned)
│       └── utils.js            # Search, filtering, sorting (planned)
│
└── tests/                      # Local tests; currently gitignored
    ├── api.test.mjs
    ├── utils.test.mjs
    └── structure.test.mjs
```

The directory structure has been created; some files are placeholders whose functionality will be added in later milestones. The `tests/` directory is currently excluded from Git tracking.

## Run Locally

Clone the repository using SSH:

```bash
git clone git@github.com:barbabarbara/TheJournal.git
cd TheJournal
```

Open the folder in **VS Code**, then serve `index.html` using **Live Server** (or another local development server). A local server will also support JavaScript modules introduced in later milestones.

## Project Status

**M1 — Initial Project Setup**

The basic folder structure, HTML foundation, and CSS foundation are prepared. Git initialization and the first push to GitHub are the remaining M1 steps, if not yet completed.

Development will continue milestone by milestone, with each feature implemented and tested separately.

## Repository

[GitHub — barbabarbara/TheJournal](https://github.com/barbabarbara/TheJournal)

## Author

Created as part of a JavaScript course assignment.


