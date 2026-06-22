// games.js - final clean version with correct paths
(async function () {
  const PER_PAGE = 10;

  function getPageFromQuery() {
    const p = new URLSearchParams(location.search).get("page");
    const n = parseInt(p, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }

  function setPageQuery(page) {
    const url = new URL(location.href);
    url.searchParams.set("page", page);
    history.replaceState(null, "", url.toString());
  }

  // FIX #1 — stay inside /Games/ so games stop 404'ing
  function buildHref(name, type) {
    return type === "dir"
      ? "./" + encodeURI(name) + "/"
      : "./" + encodeURI(name);
  }

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

    pageItems.forEach(it => {
      const div = document.createElement("div");
      div.className = "game-item";
      const a = document.createElement("a");
      a.href = buildHref(it.name, it.type);
      a.textContent = it.displayName;
      a.title = it.name;
      div.appendChild(a);
      container.appendChild(div);
    });

    const totalPages = Math.ceil(items.length / PER_PAGE);
    if (totalPages <= 1) return;

    const nav = document.createElement("div");
    nav.className = "games-pagination";
    nav.style.marginTop = "16px";
    nav.style.display = "flex";
    nav.style.gap = "8px";
    nav.style.justifyContent = "center";
    nav.style.flexWrap = "wrap";

    function btn(label, disabled, onClick, isCurrent) {
      const b = document.createElement("button");
      b.textContent = label;
      b.disabled = !!disabled;
      b.style.padding = "6px 10px";
      b.style.borderRadius = "6px";
      b.style.cursor = disabled ? "default" : "pointer";
      if (isCurrent) {
        b.style.background = "#4af";
        b.style.color = "#000";
        b.style.fontWeight = "700";
      } else {
        b.style.background = "#222";
        b.style.color = "#fff";
      }
      b.addEventListener("click", onClick);
      return b;
    }

    nav.appendChild(btn("Prev", page <= 1, () => {
      const np = Math.max(1, page - 1);
      setPageQuery(np);
      render(items, np);
    }));

    const maxButtons = 7;
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      nav.appendChild(btn("1", false, () => { setPageQuery(1); render(items, 1); }));
      if (startPage > 2) {
        const dots = document.createElement("span");
        dots.textContent = "…";
        dots.style.padding = "6px 10px";
        dots.style.color = "#aaa";
        nav.appendChild(dots);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      nav.appendChild(btn(String(i), i === page, () => {
        setPageQuery(i);
        render(items, i);
      }, i === page));
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement("span");
        dots.textContent = "…";
        dots.style.padding = "6px 10px";
        dots.style.color = "#aaa";
        nav.appendChild(dots);
      }
      nav.appendChild(btn(String(totalPages), false, () => {
        setPageQuery(totalPages);
        render(items, totalPages);
      }));
    }

    nav.appendChild(btn("Next", page >= totalPages, () => {
      const np = Math.min(totalPages, page + 1);
      setPageQuery(np);
      render(items, np);
    }));

    container.appendChild(nav);
  }

  // FIX #2 — correct fetch path so pagination works
  async function fetchStatic() {
    try {
      const res = await fetch('games.json', { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!Array.isArray(data)) return null;

      return data.map(item => {
        let display = item.name;
        if (item.type === 'file' && display.toLowerCase().endsWith('.html'))
          display = display.slice(0, -5);
        display = display.replace(/_/g, ' ');
        return { name: item.name, type: item.type, displayName: display };
      }).sort((a, b) =>
        a.displayName.toLowerCase().localeCompare(b.displayName.toLowerCase())
      );
    } catch {
      return null;
    }
  }

  const page = getPageFromQuery();
  const container = document.querySelector(".game-list");
  if (!container) return;

  container.innerHTML = "<p style='color:#aaa'>Loading games…</p>";

  let items = await fetchStatic();
  if (!items) {
    container.innerHTML = "<p style='color:#f88'>Could not load game list.</p>";
    return;
  }

  render(items, page);
})();
