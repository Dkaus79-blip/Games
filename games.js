// games.js
// Place this file in the repo root. Load it from Games/index.html with: <script src="../games.js"></script>

(async function () {
  // === CONFIG ===
  const OWNER = "Dkaus79-blip"; // GitHub username (change if different)
  const REPO = "Games";         // Repository name (change if different)
  const FOLDER = "Games";       // Folder inside the repo to list
  const BRANCH = "main";        // Branch to read
  const PER_PAGE = 10;          // Items per page
  // ==============

  // Utility: read page number from ?page= query
  function getPageFromQuery() {
    const p = new URLSearchParams(location.search).get("page");
    const n = parseInt(p, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }

  // Utility: update URL query without reloading
  function setPageQuery(page) {
    const url = new URL(location.href);
    url.searchParams.set("page", page);
    history.replaceState(null, "", url.toString());
  }

  // Build link target for an item returned by GitHub API or games.json
  function buildHref(itemName, itemType) {
    // When running from Games/index.html, links should be relative to that folder.
    // For directories, append a trailing slash so the browser loads the folder's index.html.
    if (itemType === "dir") {
      return encodeURI(itemName) + "/";
    } else {
      return encodeURI(itemName);
    }
  }

  // Render the list and pagination controls into the page
  function render(items, page) {
    const container = document.querySelector(".game-list");
    if (!container) return;

    container.innerHTML = "";

    if (!items || items.length === 0) {
      container.innerHTML = "<p style='color:#aaa'>No games found.</p>";
      return;
    }

    const start = (page - 1) * PER_PAGE;
    const pageItems = items.slice(start, start + PER_PAGE);

    // list
    pageItems.forEach(it => {
      const div = document.createElement("div");
      div.className = "game-item";
      const a = document.createElement("a");
      a.href = buildHref(it.name, it.type);
      a.textContent = it.displayName;
      a.setAttribute("title", it.name);
      div.appendChild(a);
      container.appendChild(div);
    });

    // pagination
    const totalPages = Math.ceil(items.length / PER_PAGE);
    if (totalPages > 1) {
      const nav = document.createElement("div");
      nav.style.marginTop = "24px";
      nav.style.display = "flex";
      nav.style.justifyContent = "center";
      nav.style.gap = "8px";
      nav.style.flexWrap = "wrap";

      function makeBtn(label, disabled, onClick) {
        const b = document.createElement("button");
        b.textContent = label;
        b.disabled = !!disabled;
        b.style.padding = "6px 10px";
        b.style.background = "#222";
        b.style.color = "#fff";
        b.style.border = "1px solid #333";
        b.style.borderRadius = "6px";
        b.style.cursor = disabled ? "default" : "pointer";
        b.addEventListener("click", onClick);
        return b;
      }

      // Prev
      nav.appendChild(makeBtn("Prev", page <= 1, () => {
        const np = Math.max(1, page - 1);
        setPageQuery(np);
        render(items, np);
      }));

      // Page numbers (show up to 7 numbers with ellipses if needed)
      const maxButtons = 7;
      let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
      let endPage = startPage + maxButtons - 1;
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxButtons + 1);
      }

      if (startPage > 1) {
        const b = makeBtn("1", false, () => { setPageQuery(1); render(items, 1); });
        nav.appendChild(b);
        if (startPage > 2) {
          const dots = document.createElement("span");
          dots.textContent = "…";
          dots.style.padding = "6px 10px";
          dots.style.color = "#aaa";
          nav.appendChild(dots);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        const isCurrent = i === page;
        const b = makeBtn(String(i), isCurrent, () => {
          setPageQuery(i);
          render(items, i);
        });
        if (isCurrent) {
          b.style.background = "#4af";
          b.style.color = "#000";
          b.style.fontWeight = "700";
        }
        nav.appendChild(b);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          const dots = document.createElement("span");
          dots.textContent = "…";
          dots.style.padding = "6px 10px";
          dots.style.color = "#aaa";
          nav.appendChild(dots);
        }
        const b = makeBtn(String(totalPages), false, () => {
          setPageQuery(totalPages);
          render(items, totalPages);
        });
        nav.appendChild(b);
      }

      // Next
      nav.appendChild(makeBtn("Next", page >= totalPages, () => {
        const np = Math.min(totalPages, page + 1);
        setPageQuery(np);
        render(items, np);
      }));

      container.appendChild(nav);
    }
  }

  // Try to fetch static ../games.json first (relative to Games/index.html)
  async function fetchStaticJson() {
    try {
      const res = await fetch('../games.json', { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;
      const mapped = data.map(item => {
        let display = item.name;
        if (item.type === 'file' && display.toLowerCase().endsWith('.html')) {
          display = display.slice(0, -5);
        }
        display = display.replace(/_/g, ' ');
        return { name: item.name, type: item.type, displayName: display };
      });
      // Ensure sorted alphabetically by displayName (case-insensitive)
      mapped.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
      return mapped;
    } catch (e) {
      return null;
    }
  }

  // Fallback: fetch folder contents from GitHub API
  async function fetchFromGitHubApi() {
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(FOLDER)}?ref=${BRANCH}`;
    try {
      const res = await fetch(apiUrl, { headers: { Accept: "application/vnd.github.v3+json" } });
      if (!res.ok) {
        throw new Error(`GitHub API error ${res.status}`);
      }
      const data = await res.json();
      const filtered = data.filter(item => {
        const name = item.name || "";
        if (name.startsWith(".")) return false;
        if (name.toLowerCase() === "readme.md") return false;
        return true;
      });
      const mapped = filtered.map(item => {
        let display = item.name;
        if (item.type === "file" && display.toLowerCase().endsWith(".html")) display = display.slice(0, -5);
        display = display.replace(/_/g, " ");
        return { name: item.name, type: item.type, displayName: display };
      });
      mapped.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
      return mapped;
    } catch (err) {
      console.error("Failed to fetch folder contents from GitHub API:", err);
      return null;
    }
  }

  // Fallback: read embedded fallback JSON inside the page (optional)
  function readFallbackListFromPage() {
    try {
      const el = document.getElementById("games-fallback");
      if (!el) return null;
      const json = JSON.parse(el.textContent || "[]");
      if (!Array.isArray(json)) return null;
      const mapped = json.map(item => {
        let display = item.name;
        if (item.type === "file" && display.toLowerCase().endsWith(".html")) display = display.slice(0, -5);
        display = display.replace(/_/g, " ");
        return { name: item.name, type: item.type, displayName: display };
      });
      mapped.sort((a, b) => a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase()));
      return mapped;
    } catch (e) {
      return null;
    }
  }

  // Main
  const page = getPageFromQuery();
  const container = document.querySelector(".game-list");
  if (!container) {
    console.warn("games.js: .game-list container not found on page.");
    return;
  }

  // show loading
  container.innerHTML = "<p style='color:#aaa'>Loading games…</p>";

  // Try static JSON -> GitHub API -> embedded fallback
  let items = await fetchStaticJson();
  if (!items) items = await fetchFromGitHubApi();
  if (!items) items = readFallbackListFromPage();

  if (!items) {
    container.innerHTML = "<p style='color:#f88'>Could not load game list. Try again or add a fallback list.</p>";
    return;
  }

  render(items, page);
})();
