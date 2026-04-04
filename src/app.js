const app = document.querySelector("#app");
const { siteContent } = window;

const renderHero = (profile, stats, quote) => `
  <section class="hero">
    <div class="hero-grid">
      <div>
        <span class="eyebrow">${profile.role}</span>
        <h1>${profile.name}</h1>
        <p class="hero-intro">${profile.intro}</p>
        <p class="hero-intro">${profile.blurb}</p>
        <div class="hero-actions">
          <a class="button" href="${profile.ctaPrimary.href}">${profile.ctaPrimary.label}</a>
          <a class="button-secondary" href="${profile.ctaSecondary.href}">${profile.ctaSecondary.label}</a>
        </div>
      </div>
      <div class="hero-panel">
        <div class="quote-card">
          <span class="kicker">Field Note</span>
          <p>${quote.text}</p>
          <span>${quote.attribution}</span>
        </div>
        <div class="stat-strip">
          ${stats
            .map(
              (stat) => `
                <div class="stat-block">
                  <div class="stat-value">${stat.value}</div>
                  <div class="stat-label">${stat.label}</div>
                </div>
              `
            )
            .join("")}
        </div>
      </div>
    </div>
  </section>
`;

const renderAbout = (about, profile) => `
  <section class="section-card" id="about">
    <div class="section-header">
      <div>
        <span class="section-label">Profile</span>
        <h2 class="section-heading">${about.title}</h2>
      </div>
      <p class="section-description">${about.description}</p>
    </div>
    <div class="two-column">
      <div class="detail-list">
        ${about.narrative
          .map(
            (paragraph) => `
              <div class="detail-item">
                <span>${paragraph}</span>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="detail-list">
        <div class="detail-item">
          <strong>Location</strong>
          <span>${profile.location}</span>
        </div>
        <div class="detail-item">
          <strong>Focus</strong>
          <span>${profile.focus}</span>
        </div>
        ${about.highlights
          .map(
            (item) => `
              <div class="detail-item">
                <strong>${item.label}</strong>
                <span>${item.value}</span>
              </div>
            `
          )
          .join("")}
        <div class="detail-item">
          <strong>Links</strong>
          <span>
            ${profile.links
              .map(
                (link) => `<a class="text-link" href="${link.href}" target="_blank" rel="noreferrer">${link.label}</a>`
              )
              .join(" / ")}
          </span>
        </div>
      </div>
    </div>
    <div class="content-stack">
      <span class="section-label">Timeline</span>
      <div class="timeline">
        ${about.timeline
          .map(
            (item) => `
              <article class="timeline-card">
                <div class="timeline-year">${item.year}</div>
                <div>
                  <strong>${item.title}</strong>
                  <span>${item.text}</span>
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  </section>
`;

const renderCards = (sectionId, label, title, description, items) => `
  <section class="section-card" id="${sectionId}">
    <div class="section-header">
      <div>
        <span class="section-label">${label}</span>
        <h2 class="section-heading">${title}</h2>
      </div>
      <p class="section-description">${description}</p>
    </div>
    <div class="${sectionId === "blog" ? "blog-grid" : "pub-grid"}">
      ${items
        .map(
          (item) => `
            <article class="grid-card">
              <span class="tag">${item.category || item.type}</span>
              <div>
                <strong class="entry-title">${item.title}</strong>
                <div class="entry-meta">${item.meta}</div>
              </div>
              <p class="entry-summary">${item.summary}</p>
              <a class="text-link" href="${item.href}" ${item.href === "#" ? "" : 'target="_blank" rel="noreferrer"'}>
                ${sectionId === "blog" ? "Open post" : "Open entry"}
              </a>
            </article>
          `
        )
        .join("")}
    </div>
  </section>
`;

const renderPublications = (publications) => `
  <section class="section-card" id="publications">
    <div class="section-header">
      <div>
        <span class="section-label">Selected Work</span>
        <h2 class="section-heading">${publications.title}</h2>
      </div>
      <p class="section-description">${publications.description}</p>
    </div>
    <div class="publications-list">
      ${publications.items
        .map(
          (item, index) => `
            <article class="publication-row">
              <div class="publication-index">${index + 1}.</div>
              <div class="publication-thumb">${item.shortLabel}</div>
              <div class="publication-content">
                <strong class="publication-title">${item.title}</strong>
                <div class="entry-meta">${item.meta}</div>
                <p class="publication-summary">${item.summary}</p>
                <div class="publication-links">
                  <span class="tag">${item.type}</span>
                  ${item.links
                    .map(
                      (link) =>
                        `<a class="text-link" href="${link.href}" ${link.href === "#" ? "" : 'target="_blank" rel="noreferrer"'}>${link.label}</a>`
                    )
                    .join("")}
                </div>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  </section>
`;

const renderCv = (cv) => `
  <section class="section-card" id="cv">
    <div class="section-header">
      <div>
        <span class="section-label">Résumé</span>
        <h2 class="section-heading">${cv.title}</h2>
      </div>
      <p class="section-description">${cv.description}</p>
    </div>
    <div class="cv-card">
      ${cv.sections
        .map(
          (section) => `
            <div class="cv-block">
              <h3>${section.heading}</h3>
              <ul class="cv-list">
                ${section.items.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          `
        )
        .join("")}
      <p class="cv-note">${cv.note}</p>
    </div>
  </section>
`;

const renderFooter = (footer) => `
  <footer class="site-footer">
    <span>${footer.left}</span>
    <span>${footer.right}</span>
  </footer>
`;

app.innerHTML = `
  ${renderHero(siteContent.profile, siteContent.stats, siteContent.quote)}
  <div class="content-stack">
    ${renderAbout(siteContent.about, siteContent.profile)}
    ${renderCards(
      "blog",
      "Writing",
      siteContent.blog.title,
      siteContent.blog.description,
      siteContent.blog.posts
    )}
    ${renderPublications(siteContent.publications)}
    ${renderCv(siteContent.cv)}
    ${renderFooter(siteContent.footer)}
  </div>
`;
