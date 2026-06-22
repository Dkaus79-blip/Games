// games.js
// Place this file in the repo root. It populates Games/index.html with an alphabetical,
// paginated list (10 per page) by reading the repo contents via GitHub API.

(async function () {
  const OWNER = "Dkaus79-blip"; // your GitHub username (adjust if different)
  const REPO = "Games";         // repo name
  const FOLDER = "Games";       // folder to list
  const BRANCH = "main";        // branch to read
  const PER_PAGE = 10;          // items per page

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

  // Build link target for an item returned by GitHub API
  function buildHref(itemName, itemType) {
    // index.html is inside Games/, so links should be relative to that folder
    // e.g., "Catnip Scramble.html" or "DrinkStandTycoon/"
    const encoded = encodeURI(itemName);
    return itemType === "dir" ? `${encoded}/` : `${encoded}`;
  }

  // Render the list and pagination controls into the page
  function render(items, page) {
    const container = document.querySelector(".game-list");
    if (!container) return;

    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = "<p>No games found.</p>";
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

  // Fetch folder contents from GitHub API
  async function fetchFolderContents() {
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURIComponent(FOLDER)}?ref=${BRANCH}`;
    try {
      const res = await fetch(apiUrl, { headers: { Accept: "application/vnd.github.v3+json" } });
      if (!res.ok) {
        throw new Error(`GitHub API error ${res.status}`);
      }
      const data = await res.json();
      // Filter out hidden files like .gitkeep and README.md if present
      const filtered = data.filter(item => {
        const name = item.name || "";
        if (name.startsWith(".")) return false;
        // optionally ignore README.md inside folder
        if (name.toLowerCase() === "readme.md") return false;
        return true;
      });

      // Map to simpler objects and sort alphabetically by displayName
      const mapped = filtered.map(item => {
        // displayName: nicer label (remove extension for .html)
        let display = item.name;
        if (item.type === "file" && display.toLowerCase().endsWith(".html")) {
          display = display.slice(0, -5);
        }
        // Replace underscores with spaces and keep capitalization
        display = display.replace(/_/g, " ");
        return { name: item.name, type: item.type, displayName: display };
      });

      mapped.sort((a, b) => {
        const A = a.displayName.toLowerCase();
        const B = b.displayName.toLowerCase();
        if (A < B) return -1;
        if (A > B) return 1;
        return 0;
      });

      return mapped;
    } catch (err) {
      console.error("Failed to fetch folder contents:", err);
      return null;
    }
  }

  // Fallback: if API fails, try to use a hardcoded list embedded in index.html
  function readFallbackListFromPage() {
    // If you want a fallback, add a <script id="games-fallback" type="application/json">[...]</script>
    // inside Games/index.html. This function will read it.
    try {
      const el = document.getElementById("games-fallback");
      if (!el) return null;
      const json = JSON.parse(el.textContent || "[]");
      // json should be array of { name: "Catnip Scramble.html", type: "file" } etc.
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

  let items = await fetchFolderContents();
  if (!items) {
    // try fallback
    items = readFallbackListFromPage();
  }

  if (!items) {
    container.innerHTML = "<p style='color:#f88'>Could not load game list. Try again or add a fallback list.</p>";
    return;
  }

  render(items, page);
})();
