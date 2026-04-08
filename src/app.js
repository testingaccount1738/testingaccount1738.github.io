const app = document.querySelector("#app");
const page = document.body.dataset.page || "about";
const base = document.body.dataset.base || ".";
const slug = document.body.dataset.slug || "";
const { siteContent } = window;

const navHref = (target) =>
  target === "about" ? `${base}/index.html` : `${base}/${target}/index.html`;

const absoluteHref = (path) => `${base}/${path}`.replace(/\/+/g, "/").replace(":/", "://");

const icon = (name) => {
  const icons = {
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    scholar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l8 4-8 4-8-4 8-4z" fill="currentColor"/><path d="M7 11v4.5c0 1.9 2.2 3.5 5 3.5s5-1.6 5-3.5V11" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="15.5" r="1.3" fill="currentColor"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 00-2.7 16.6c.4.1.5-.2.5-.4v-1.7c-2.2.5-2.7-.9-2.7-.9-.3-.8-.8-1-1.1-1.2-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.7-1.4-1.8-.2-3.7-.9-3.7-4.2 0-.9.3-1.7.9-2.3-.1-.2-.4-1.1.1-2.2 0 0 .7-.2 2.4.9a8 8 0 014.4 0c1.7-1.1 2.4-.9 2.4-.9.5 1.1.2 2 .1 2.2.6.6.9 1.4.9 2.3 0 3.2-1.9 3.9-3.7 4.1.4.3.8.9.8 1.8v2.7c0 .2.1.5.5.4A8.5 8.5 0 0012 3.5z" fill="currentColor"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h3.7l4 5.3L17.2 4H19l-5.5 6.3L20 20h-3.7l-4.4-5.8L6.7 20H5l5.9-6.8z" fill="currentColor"/></svg>',
    rss: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6.2" cy="17.8" r="1.9" fill="currentColor"/><path d="M4.5 10.4a9.1 9.1 0 019.1 9.1" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4.5 5a14.5 14.5 0 0114.5 14.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.8" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 15l5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M18.5 4.5l.8 2.3 2.2.7-2.2.8-.8 2.2-.7-2.2-2.3-.8 2.3-.7z" fill="currentColor"/></svg>'
  };
  return icons[name] || "";
};

const renderHeader = () => `
  <header class="site-header">
    <div class="social-links">
      ${siteContent.profile.socialLinks
        .map(
          (link) => `
            <a class="icon-link" href="${link.href}" aria-label="${link.label}" target="_blank" rel="noreferrer">
              ${icon(link.icon)}
            </a>
          `
        )
        .join("")}
    </div>
    <div class="header-right">
      <nav class="site-nav" aria-label="Main navigation">
        ${["about", "blog", "publications", "cv"]
          .map(
            (item) => `
              <a class="${page === item ? "active" : ""}" href="${navHref(item)}">${item}</a>
            `
          )
          .join("")}
      </nav>
      <div class="utility-links">
        <button class="search-trigger utility-pill-button" type="button" aria-label="Open search">⌘ k</button>
        <button class="search-trigger utility-icon-button" type="button" aria-label="Open search">${icon("search")}</button>
        <span class="utility-icon">${icon("spark")}</span>
      </div>
    </div>
  </header>
`;

const renderHome = () => `
  <section class="home-grid">
    <div class="home-copy">
      <h1 class="home-title">${siteContent.profile.homeTitle}</h1>
      ${siteContent.profile.aboutParagraphs.map((paragraph) => `<p class="lede">${paragraph}</p>`).join("")}
    </div>
    <aside class="portrait-card">
      <div class="portrait-frame">
        <div class="portrait-gradient"></div>
        <div class="portrait-initials">${siteContent.profile.portrait.initials}</div>
      </div>
    </aside>
  </section>

  <section class="page-section">
    <h2 class="page-heading">selected publications</h2>
    <div class="publication-list">
      ${siteContent.homePublications
        .map(
          (item) => `
            <article class="publication-item">
              <div class="thumb-card ${item.accent}"><span>${item.thumb}</span></div>
              <div class="publication-text">
                <h3>${item.title}</h3>
                <p class="publication-authors">${item.authors}</p>
                <p class="publication-venue"><em>${item.venue}</em></p>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  </section>
`;

const renderBlog = () => `
  <section class="page-hero centered">
    <h1 class="blog-title">${siteContent.blog.title}</h1>
    <p class="blog-subtitle">${siteContent.blog.subtitle}</p>
  </section>

  <section class="stack-list">
    ${siteContent.blog.posts
      .map(
        (post) => `
          <article class="blog-row">
            <div class="blog-copy">
              <h2><a class="post-link" href="${base}/blog/posts/${post.slug}/index.html">${post.title}</a></h2>
              <p class="blog-summary">${post.summary}</p>
              <p class="blog-meta">${post.readTime} · ${post.date}</p>
              <p class="blog-year">${post.year}</p>
            </div>
            <a class="blog-thumb ${post.accent}" href="${base}/blog/posts/${post.slug}/index.html"><span>${post.thumb}</span></a>
          </article>
        `
      )
      .join("")}
  </section>
`;

const renderPublications = () => `
  <section class="page-hero">
    <h1 class="page-title">publications</h1>
  </section>

  ${siteContent.publications
    .map(
      (group) => `
        <section class="year-section">
          <h2 class="year-heading">${group.year}</h2>
          <div class="publication-list">
            ${group.items
              .map(
                (item) => `
                  <article class="publication-item">
                    <div class="thumb-card ${item.accent}"><span>${item.thumb}</span></div>
                    <div class="publication-text">
                      <h3>${item.title}</h3>
                      <p class="publication-authors">${item.authors}</p>
                      <p class="publication-venue"><em>${item.venue}</em></p>
                    </div>
                  </article>
                `
              )
              .join("")}
          </div>
        </section>
      `
    )
    .join("")}
`;

const renderCv = () => `
  <div class="cv-layout">
    <aside class="cv-side-nav">
      <a href="#education" class="active">Education</a>
      <a href="#work">Work</a>
      <a href="#awards">Awards</a>
    </aside>
    <div class="cv-main">
      <section class="page-hero cv-hero">
        <h1 class="page-title">CV</h1>
      </section>

      ${siteContent.cv.sections
        .map((section) => {
          const anchorMap = {
            education: "education",
            appointments: "work",
            "selected honors": "awards",
            "teaching and service": "service"
          };
          const sectionId = anchorMap[section.title] || section.title.replace(/\s+/g, "-");
          return `
            <section class="cv-panel" id="${sectionId}">
              <h2 class="cv-panel-title">${section.title === "appointments" ? "Work" : section.title === "selected honors" ? "Awards" : section.title.charAt(0).toUpperCase() + section.title.slice(1)}</h2>
              <div class="cv-entries">
                ${section.items
                  .map(
                    (item) => `
                      <article class="cv-entry">
                        <div class="cv-years">${item.years}</div>
                        <div class="cv-body">
                          <h3>${item.role}</h3>
                          <p class="cv-org">${item.org}</p>
                          <p class="cv-detail"><em>${item.detail}</em></p>
                        </div>
                      </article>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  </div>
`;

const renderPost = (post) => `
  <article class="post-shell">
    <section class="post-hero">
      <h1 class="post-title">${post.title}</h1>
      <p class="post-dek">${post.dek}</p>
    </section>

    <section class="post-meta-grid">
      <div>
        <span class="meta-label">authors</span>
        <div class="meta-value">${post.author}</div>
      </div>
      <div>
        <span class="meta-label">affiliations</span>
        <div class="meta-value">${post.affiliation}</div>
      </div>
      <div>
        <span class="meta-label">published</span>
        <div class="meta-value">${post.date}</div>
      </div>
    </section>

    <section class="post-body">
      <p class="post-note">${post.note}</p>
      ${post.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}
    </section>
  </article>
`;

const searchDocuments = () => {
  const aboutText = siteContent.profile.aboutParagraphs.join(" ");
  const publicationItems = siteContent.publications.flatMap((group) =>
    group.items.map((item) => ({
      title: item.title,
      body: `${item.authors} ${item.venue}`,
      type: "Publication",
      href: absoluteHref("publications/index.html")
    }))
  );

  const cvItems = siteContent.cv.sections
    .filter((section) => ["education", "appointments", "selected honors"].includes(section.title))
    .map((section) => {
      const anchorMap = {
        education: "education",
        appointments: "work",
        "selected honors": "awards"
      };
      return {
        title: section.title === "appointments" ? "Work" : section.title === "selected honors" ? "Awards" : "Education",
        body: section.items.map((item) => `${item.role} ${item.org} ${item.detail}`).join(" "),
        type: "CV",
        href: absoluteHref(`cv/index.html#${anchorMap[section.title]}`)
      };
    });

  return [
    {
      title: "About",
      body: aboutText,
      type: "Page",
      href: absoluteHref("index.html")
    },
    ...siteContent.blog.posts.map((post) => ({
      title: post.title,
      body: `${post.summary} ${post.dek} ${post.paragraphs.join(" ")}`,
      type: "Blog",
      href: absoluteHref(`blog/posts/${post.slug}/index.html`)
    })),
    ...publicationItems,
    ...cvItems
  ];
};

const renderSearchOverlay = () => `
  <div class="search-overlay" hidden>
    <div class="search-backdrop"></div>
    <div class="search-dialog" role="dialog" aria-modal="true" aria-label="Site search">
      <div class="search-head">
        <input class="search-input" type="text" placeholder="Search posts, publications, CV, and about..." />
        <button class="search-close" type="button" aria-label="Close search">Close</button>
      </div>
      <div class="search-results"></div>
    </div>
  </div>
`;

const attachSearch = () => {
  const overlay = document.querySelector(".search-overlay");
  const input = document.querySelector(".search-input");
  const resultsEl = document.querySelector(".search-results");
  const docs = searchDocuments();

  const paintResults = (query = "") => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? docs.filter((doc) => `${doc.title} ${doc.body}`.toLowerCase().includes(normalized))
      : docs.slice(0, 6);

    resultsEl.innerHTML = matches.length
      ? matches
          .slice(0, 8)
          .map(
            (doc) => `
              <a class="search-result" href="${doc.href}">
                <span class="search-type">${doc.type}</span>
                <strong>${doc.title}</strong>
                <span>${doc.body.slice(0, 110)}${doc.body.length > 110 ? "..." : ""}</span>
              </a>
            `
          )
          .join("")
      : `<div class="search-empty">No matches found.</div>`;
  };

  const openSearch = () => {
    overlay.hidden = false;
    document.body.classList.add("search-open");
    paintResults();
    input.focus();
    input.select();
  };

  const closeSearch = () => {
    overlay.hidden = true;
    document.body.classList.remove("search-open");
  };

  document.querySelectorAll(".search-trigger").forEach((button) => {
    button.addEventListener("click", openSearch);
  });

  document.querySelector(".search-close").addEventListener("click", closeSearch);
  document.querySelector(".search-backdrop").addEventListener("click", closeSearch);
  input.addEventListener("input", (event) => paintResults(event.currentTarget.value));

  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openSearch();
    }
    if (event.key === "Escape" && !overlay.hidden) {
      closeSearch();
    }
  });
};

const renderPage = () => {
  const pages = {
    about: renderHome,
    blog: renderBlog,
    publications: renderPublications,
    cv: renderCv,
    post: () => renderPost(siteContent.postsBySlug[slug] || siteContent.blog.posts[0])
  };

  const render = pages[page] || renderHome;
  app.innerHTML = `
    <div class="page-shell">
      ${renderHeader()}
      <main class="site-main">
        ${render()}
      </main>
      ${renderSearchOverlay()}
    </div>
  `;
};

renderPage();
attachSearch();
