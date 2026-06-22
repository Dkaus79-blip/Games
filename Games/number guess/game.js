// Small, loud beep that works in Edge
const winBeep = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAAAgICA");

// Unlock audio on first click (Edge requirement)
document.addEventListener("click", () => {
    winBeep.play().catch(() => {});
}, { once: true });

let secretNumber = 0;
let guesses = 0;
let players = 1;
let currentPlayer = 1;

function startGame(p) {
    players = p;
    secretNumber = Math.floor(Math.random() * 100) + 1;
    guesses = 0;
    currentPlayer = 1;

    document.getElementById("menu").style.display = "none";
    document.getElementById("game").style.display = "block";

    updateTurnText();
}

function updateTurnText() {
    if (players === 1) {
        document.getElementById("turnText").textContent = "Player: Guess the number!";
    } else {
        document.getElementById("turnText").textContent = "Player " + currentPlayer + "'s turn";
    }
}

function makeGuess() {
    const input = document.getElementById("guessInput");
    const guess = parseInt(input.value);
    if (!guess) return;

    guesses++;

    if (guess > secretNumber) {
        setFeedback("Too high!");
        nextTurn();
    } else if (guess < secretNumber) {
        setFeedback("Too low!");
        nextTurn();
    } else {
        winSequence();
    }

    input.value = "";
}

function nextTurn() {
    if (players === 2) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        updateTurnText();
    }
    document.getElementById("guessCount").textContent = "Guesses: " + guesses;
}

function setFeedback(text) {
    document.getElementById("feedback").textContent = text;
}

function winSequence() {
    setFeedback("Correct! Player " + currentPlayer + " wins!");
    document.getElementById("guessCount").textContent = "Total guesses: " + guesses;

    // Beep alert
    let beepCount = 0;
    const beepInterval = setInterval(() => {
        winBeep.currentTime = 0;
        winBeep.play();
        beepCount++;
        if (beepCount > 5) clearInterval(beepInterval);
    }, 150);

    // Flash screen
    let flashes = 0;
    const flashInterval = setInterval(() => {
        document.body.style.background =
            document.body.style.background === "black" ? "#00ff80" : "black";
        flashes++;
        if (flashes > 20) {
            clearInterval(flashInterval);
            document.body.style.background = "black";
        }
    }, 80);

    // NEW NUMBER after win
    secretNumber = Math.floor(Math.random() * 100) + 1;
    guesses = 0;
}
