const username = "YOUR_USERNAME";
const repo = "YOUR_REPO";

fetch(`https://api.github.com/repos/${username}/${repo}/contents/games`)
  .then(r => r.json())
  .then(items => {
    const container = document.getElementById("game-list");
    container.innerHTML = "";

    items.forEach(item => {
      // Single HTML file (pong.html)
      if (item.type === "file" && item.name.endsWith(".html")) {
        const title = item.name.replace(".html", "");
        const file = `games/${item.name}`;

        container.innerHTML += `
          <div class="game">
            <h2>${title}</h2>
            <a href="${file}">Play</a>
          </div>
        `;
      }

      // Folder game (mario/index.html)
      if (item.type === "dir") {
        const title = item.name;
        const file = `games/${item.name}/index.html`;

        container.innerHTML += `
          <div class="game">
            <h2>${title}</h2>
            <a href="${file}">Play</a>
          </div>
        `;
      }
    });
  })
  .catch(err => {
    document.getElementById("game-list").innerText = "Error loading games.";
    console.error(err);
  });
