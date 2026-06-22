fetch("games.json")
  .then(response => response.json())
  .then(games => {
    const container = document.getElementById("game-list");
    container.innerHTML = "";

    games.forEach(game => {
      const div = document.createElement("div");
      div.className = "game";

      div.innerHTML = `
        <img src="${game.thumbnail}" alt="${game.title}">
        <h2>${game.title}</h2>
        <a href="${game.file}">Play</a>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    document.getElementById("game-list").innerText = "Error loading games.";
    console.error(err);
  });
