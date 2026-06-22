const username = "Dkaus79-blip";
const repo = "Games";
const branch = "main"; 
const gamesFolder = "Games/Games";

fetch(`https://api.github.com/repos/${username}/${repo}/contents/${gamesFolder}?ref=${branch}`)
  .then(r => r.json())
  .then(items => {
    if (!Array.isArray(items)) {
      throw new Error("Invalid response");
    }

    let games = [];

    items.forEach(item => {
      if (item.type === "file" && item.name.endsWith(".html")) {
        games.push({
          title: item.name.replace(".html", ""),
          file: `${gamesFolder}/${item.name}`
        });
      }

      if (item.type === "dir") {
        games.push({
          title: item.name,
          file: `${gamesFolder}/${item.name}/index.html`
        });
      }
    });

    // Sort A–Z
    games.sort((a, b) => a.title.localeCompare(b.title));

    // Pagination
    let currentPage = 1;
    const perPage = 10;

    function renderPage() {
      const container = document.getElementById("game-list");
      container.innerHTML = "";

      const start = (currentPage - 1) * perPage;
      const end = start + perPage;
      const pageGames = games.slice(start, end);

      pageGames.forEach(g => {
        container.innerHTML += `
          <div class="game">
            <h2>${g.title}</h2>
            <a href="${g.file}">Play</a>
          </div>
        `;
      });

      renderPagination();
    }

    function renderPagination() {
      const totalPages = Math.ceil(games.length / perPage);
      const nav = document.getElementById("pagination");
      nav.innerHTML = "";

      if (currentPage > 1) {
        nav.innerHTML += `<button id="prevBtn">Back</button>`;
      }

      if (currentPage < totalPages) {
        nav.innerHTML += `<button id="nextBtn">Next</button>`;
      }

      if (document.getElementById("prevBtn")) {
        document.getElementById("prevBtn").onclick = () => {
          currentPage--;
          renderPage();
        };
      }

      if (document.getElementById("nextBtn")) {
        document.getElementById("nextBtn").onclick = () => {
          currentPage++;
          renderPage();
        };
      }
    }

    renderPage();
  })
  .catch(err => {
    document.getElementById("game-list").innerText = "Error loading games.";
    console.error("API error:", err);
  });
