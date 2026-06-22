console.log("JS loaded!"); // DEBUG

const username = "Dkaus79-blip";
const repo = "Games";
const branch = "main";
const gamesFolder = "Games"; // CORRECT FOLDER

const apiURL = `https://api.github.com/repos/${username}/${repo}/contents/${gamesFolder}?ref=${branch}`;
console.log("API URL:", apiURL); // DEBUG

let games = [];
let currentPage = 1;
const perPage = 10;

// Fetch contents of a folder and find the first HTML file
async function findHtmlInFolder(folderPath) {
  const url = `https://api.github.com/repos/${username}/${repo}/contents/${folderPath}?ref=${branch}`;
  console.log("Checking folder:", url);

  const res = await fetch(url);
  const items = await res.json();

  if (!Array.isArray(items)) {
    console.warn("Folder returned non-array:", items);
    return null;
  }

  // Find first .html file
  const htmlFile = items.find(i => i.type === "file" && i.name.endsWith(".html"));

  if (htmlFile) {
    console.log("Found HTML in folder:", htmlFile.path);
    return htmlFile.path;
  }

  console.warn("No HTML found in folder:", folderPath);
  return null;
}

function renderPage() {
  console.log("Rendering page:", currentPage);

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

async function loadGames() {
  const res = await fetch(apiURL);
  const items = await res.json();

  console.log("API JSON:", items);

  if (!Array.isArray(items)) {
    console.error("Invalid API response:", items);
    document.getElementById("game-list").innerText = "Error loading games.";
    return;
  }

  games = [];

  for (const item of items) {
    console.log("Processing:", item.name, "type:", item.type);

    // Single HTML file
    if (item.type === "file" && item.name.endsWith(".html")) {
      games.push({
        title: item.name.replace(".html", ""),
        file: `${gamesFolder}/${item.name}`
      });
    }

    // Folder — auto-detect HTML inside
    if (item.type === "dir") {
      const htmlPath = await findHtmlInFolder(`${gamesFolder}/${item.name}`);

      if (htmlPath) {
        games.push({
          title: item.name,
          file: htmlPath
        });
      } else {
        console.warn("Skipping folder with no HTML:", item.name);
      }
    }
  }

  console.log("Final games list:", games);

  // Sort A–Z
  games.sort((a, b) => a.title.localeCompare(b.title));

  renderPage();
}

loadGames().catch(err => {
  console.error("FINAL ERROR:", err);
  document.getElementById("game-list").innerText = "Error loading games.";
});
