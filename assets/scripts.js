const page = document.body.dataset.page;

const routes = {
  site: "/data/site.json",
  publications: "/data/publications.json"
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendChildren(parent, children) {
  children.filter(Boolean).forEach((child) => parent.appendChild(child));
  return parent;
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Unable to load ${path}`);
  return response.json();
}

function setText(selector, value) {
  const node = qs(selector);
  if (node && value) node.textContent = value;
}

function initChrome() {
  const year = qs("#year");
  if (year) year.textContent = new Date().getFullYear();

  const toggle = qs("#navToggle");
  const menu = qs("#menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  const root = document.documentElement;
  const themeButton = qs("#themeToggle");
  const saved = safeStorageGet("theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = saved || (prefersDark ? "dark" : "light");

  if (themeButton) {
    themeButton.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      safeStorageSet("theme", next);
    });
  }
}

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return null;
  }
}

function renderTags(tags = []) {
  if (!tags.length) return null;
  const list = el("ul", "tag-list");
  tags.forEach((tag) => list.appendChild(el("li", "", tag)));
  return list;
}

function renderContactLinks(profile) {
  const container = qs("#contactLinks");
  if (!container) return;
  container.innerHTML = "";

  const email = el("a", "button", "Email");
  email.href = `mailto:${profile.email}`;
  container.appendChild(email);

  profile.links.forEach((link) => {
    const anchor = el("a", "button quiet", link.label);
    anchor.href = link.url;
    anchor.rel = "me";
    container.appendChild(anchor);
  });
}

function renderStats(stats = []) {
  const list = qs("#statList");
  if (!list) return;
  list.innerHTML = "";
  stats.forEach((item) => {
    list.appendChild(el("dt", "", item.label));
    list.appendChild(el("dd", "", item.value));
  });
}

function renderResearchAreas(areas = []) {
  const container = qs("#researchAreas");
  if (!container) return;
  container.innerHTML = "";
  areas.forEach((area) => {
    const card = el("article", "research-card");
    appendChildren(card, [
      el("h3", "", area.title),
      el("p", "", area.summary),
      renderTags(area.tags)
    ]);
    container.appendChild(card);
  });
}

function publicationLink(pub) {
  return pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : "");
}

function renderPublication(pub) {
  const item = el("li", "publication-card");
  const titleUrl = publicationLink(pub);
  const title = titleUrl ? el("a", "publication-title", pub.title) : el("span", "publication-title", pub.title);
  if (titleUrl) title.href = titleUrl;

  const meta = el("p", "publication-meta", `${pub.authors} | ${pub.venue} | ${pub.year}`);
  const links = el("div", "publication-links");

  if (pub.doi) {
    const doi = el("a", "", `doi:${pub.doi}`);
    doi.href = `https://doi.org/${pub.doi}`;
    links.appendChild(doi);
  }

  if (pub.url && (!pub.doi || pub.url !== `https://doi.org/${pub.doi}`)) {
    const source = el("a", "", "source");
    source.href = pub.url;
    links.appendChild(source);
  }

  if (pub.note) links.appendChild(el("span", "", pub.note));
  appendChildren(item, [title, meta, links.childNodes.length ? links : null]);
  return item;
}

function sortedPublications(publications) {
  return [...publications].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return (a.order || 100) - (b.order || 100);
  });
}

function renderSelectedPublications(publications) {
  const list = qs("#selectedPublications");
  if (!list) return;
  list.innerHTML = "";
  sortedPublications(publications)
    .filter((pub) => pub.selected)
    .slice(0, 6)
    .forEach((pub) => list.appendChild(renderPublication(pub)));
}

function renderPublicationPage(publications) {
  const list = qs("#publicationList");
  const search = qs("#publicationSearch");
  const yearSelect = qs("#publicationYear");
  const typeSelect = qs("#publicationType");
  const count = qs("#publicationCount");
  if (!list || !search || !yearSelect || !typeSelect) return;

  const pubs = sortedPublications(publications);
  [...new Set(pubs.map((pub) => pub.year))].forEach((year) => {
    const option = el("option", "", String(year));
    option.value = String(year);
    yearSelect.appendChild(option);
  });

  [...new Set(pubs.map((pub) => pub.type).filter(Boolean))].sort().forEach((type) => {
    const option = el("option", "", titleCase(type));
    option.value = type;
    typeSelect.appendChild(option);
  });

  function update() {
    const query = search.value.trim().toLowerCase();
    const year = yearSelect.value;
    const type = typeSelect.value;
    const filtered = pubs.filter((pub) => {
      const haystack = [pub.title, pub.authors, pub.venue, pub.year, pub.type, ...(pub.keywords || [])].join(" ").toLowerCase();
      return (!query || haystack.includes(query)) &&
        (!year || String(pub.year) === year) &&
        (!type || pub.type === type);
    });
    list.innerHTML = "";
    filtered.forEach((pub) => list.appendChild(renderPublication(pub)));
    if (count) count.textContent = `${filtered.length} publication${filtered.length === 1 ? "" : "s"}`;
  }

  [search, yearSelect, typeSelect].forEach((control) => control.addEventListener("input", update));
  update();
}

function titleCase(value) {
  return value.replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function renderNews(news = []) {
  const list = qs("#newsList");
  if (!list) return;
  list.innerHTML = "";
  news.forEach((item) => {
    const row = el("li");
    const time = el("time", "", item.dateLabel);
    if (item.date) time.dateTime = item.date;
    appendChildren(row, [time, el("span", "", item.text)]);
    list.appendChild(row);
  });
}

function renderProject(project) {
  const card = el("article", "project-card");
  const title = project.url ? el("a", "project-link", project.name) : el("span", "project-link", project.name);
  if (project.url) title.href = project.url;
  const titleWrap = el("h3");
  titleWrap.appendChild(title);
  const meta = el("div", "project-meta");
  [project.role, project.status].filter(Boolean).forEach((item) => meta.appendChild(el("span", "", item)));
  appendChildren(card, [
    titleWrap,
    el("p", "", project.summary),
    renderTags(project.tags),
    meta.childNodes.length ? meta : null
  ]);
  return card;
}

function renderProjects(projects = [], selector = "#projectsList", featuredOnly = false) {
  const container = qs(selector);
  if (!container) return;
  container.innerHTML = "";
  projects
    .filter((project) => !featuredOnly || project.featured)
    .forEach((project) => container.appendChild(renderProject(project)));
}

function renderTimeline(selector, items = []) {
  const container = qs(selector);
  if (!container) return;
  container.innerHTML = "";
  items.forEach((item) => {
    const row = el("article", "timeline-item");
    appendChildren(row, [
      el("div", "timeline-date", item.date),
      el("h3", "", item.title),
      el("p", "", item.organization),
      item.detail ? el("p", "", item.detail) : null
    ]);
    container.appendChild(row);
  });
}

function renderSimpleList(selector, items = []) {
  const list = qs(selector);
  if (!list) return;
  list.innerHTML = "";
  items.forEach((item) => list.appendChild(el("li", "", item)));
}

function renderCv(site) {
  setText("#cvIntro", site.profile.cvIntro);
  renderTimeline("#appointmentsList", site.cv.appointments);
  renderTimeline("#educationList", site.cv.education);
  renderSimpleList("#teachingList", site.cv.teaching);
  renderSimpleList("#awardList", site.cv.awards);
}

function renderHome(site, publications) {
  setText("#heroSummary", site.profile.summary);
  setText("#heroTitle", `${site.profile.title}, ${site.profile.affiliation}`);
  setText("#researchStatement", site.profile.researchStatement);
  renderStats(site.profile.stats);
  renderResearchAreas(site.researchAreas);
  renderSelectedPublications(publications);
  renderNews(site.news);
  renderProjects(site.projects, "#featuredProjects", true);
  renderContactLinks(site.profile);
}

function showLoadError(error) {
  const main = qs("#main");
  if (!main) return;
  const box = el("div", "container load-error", "The site content could not be loaded. Check the JSON data files and try again.");
  box.dataset.error = error.message;
  main.prepend(box);
}

async function init() {
  initChrome();
  try {
    const [site, publications] = await Promise.all([
      fetchJson(routes.site),
      fetchJson(routes.publications)
    ]);

    if (page === "home") renderHome(site, publications);
    if (page === "publications") renderPublicationPage(publications);
    if (page === "projects") renderProjects(site.projects);
    if (page === "cv") renderCv(site);
  } catch (error) {
    console.warn(error);
    showLoadError(error);
  }
}

init();
