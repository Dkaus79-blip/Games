// ===============================
// DRINK STAND TYCOON — FINAL MERGED GAME.JS
// ===============================

// CONSTANTS
const GOAL_AMOUNT = 2000;
const TOTAL_DAYS = 90;

// GAME STATE
let day = 1;
let cash = 100;
let upgrades = {
    sign: false,
    ingredients: false,
    service: false,
    radio: false,
    storage: false
};

let todayWeather = null;
let tomorrowWeather = null;

// DRINK DATA
const drinks = [
    { id: "lemonade", name: "Lemonade", baseCost: 0.20, baseDemand: 1.0, idealTempMin: 78, idealTempMax: 95 },
    { id: "sweet_tea", name: "Sweet Tea", baseCost: 0.25, baseDemand: 0.9, idealTempMin: 75, idealTempMax: 92 },
    { id: "iced_coffee", name: "Iced Coffee", baseCost: 0.35, baseDemand: 0.7, idealTempMin: 70, idealTempMax: 88 },
    { id: "smoothie", name: "Smoothies", baseCost: 0.50, baseDemand: 0.6, idealTempMin: 80, idealTempMax: 100 },
    { id: "energy", name: "Energy Drinks", baseCost: 0.45, baseDemand: 0.8, idealTempMin: 72, idealTempMax: 95 }
];

// WEATHER TYPES
const weatherTypes = [
    { name: "Hot & Sunny", icon: "☀️", tempMin: 85, tempMax: 100, traffic: 1.2 },
    { name: "Warm & Clear", icon: "🌤️", tempMin: 78, tempMax: 88, traffic: 1.0 },
    { name: "Mild & Cloudy", icon: "⛅", tempMin: 70, tempMax: 80, traffic: 0.9 },
    { name: "Cool & Breezy", icon: "🌥️", tempMin: 65, tempMax: 75, traffic: 0.8 },
    { name: "Rainy", icon: "🌧️", tempMin: 60, tempMax: 72, traffic: 0.6 },
    { name: "Stormy", icon: "⛈️", tempMin: 60, tempMax: 70, traffic: 0.4 }
];

// DOM ELEMENTS
const startScreen = document.getElementById("start-screen");
const startBtn = document.getElementById("start-btn");
const gameScreen = document.getElementById("game-screen");

const dayDisplay = document.getElementById("day-display");
const cashDisplay = document.getElementById("cash-display");
const goalDisplay = document.getElementById("goal-display");

const weatherIcon = document.getElementById("weather-icon");
const weatherTemp = document.getElementById("weather-temp");
const weatherDesc = document.getElementById("weather-desc");

const drinkRows = document.getElementById("drink-rows");
const runDayBtn = document.getElementById("run-day-btn");
const reportOutput = document.getElementById("report-output");

const upgradeButtons = document.querySelectorAll(".upgrade-btn");
const upgradeMsg = document.getElementById("upgrade-msg");
const forecastText = document.getElementById("tomorrow-forecast");

const endPanel = document.getElementById("end-game-panel");
const endTitle = document.getElementById("end-title");
const endSummary = document.getElementById("end-summary");
const restartBtn = document.getElementById("restart-btn");

// ===============================
// SAVE SYSTEM — 3 SLOTS + AUTOSAVE
// ===============================

const SAVE_KEYS = {
    AUTO: "drinkstand_autosave",
    SLOT1: "drinkstand_slot1",
    SLOT2: "drinkstand_slot2",
    SLOT3: "drinkstand_slot3"
};

// Build save object
function buildSaveObject() {
    const priceInputs = document.querySelectorAll(".price-input");
    const cupsInputs = document.querySelectorAll(".cups-input");

    const drinkSettings = {};

    priceInputs.forEach(input => {
        drinkSettings[input.dataset.drinkId] = drinkSettings[input.dataset.drinkId] || {};
        drinkSettings[input.dataset.drinkId].price = parseFloat(input.value);
    });

    cupsInputs.forEach(input => {
        drinkSettings[input.dataset.drinkId] = drinkSettings[input.dataset.drinkId] || {};
        drinkSettings[input.dataset.drinkId].cups = parseInt(input.value);
    });

    return {
        day,
        cash,
        upgrades,
        drinkSettings,
        todayWeather,
        tomorrowWeather,
        timestamp: new Date().toLocaleString()
    };
}

// Load save slot
function loadFromSlot(slotKey) {
    const raw = localStorage.getItem(slotKey);
    if (!raw) return false;

    const data = JSON.parse(raw);

    day = data.day;
    cash = data.cash;
    upgrades = data.upgrades;
    todayWeather = data.todayWeather;
    tomorrowWeather = data.tomorrowWeather;

    window._loadedDrinkSettings = data.drinkSettings;

    return true;
}

// Auto-save
function autoSave() {
    localStorage.setItem(SAVE_KEYS.AUTO, JSON.stringify(buildSaveObject()));
}
// ===============================
// START SCREEN — LOAD BUTTONS
// ===============================

function addStartScreenLoadButtons() {
    const container = document.createElement("div");
    container.style.marginTop = "30px";
    container.style.textAlign = "center";

    function makeLoadBtn(label, key) {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.className = "retro-button small";
        btn.style.margin = "5px";
        btn.style.display = localStorage.getItem(key) ? "inline-block" : "none";
        btn.onclick = () => {
            if (loadFromSlot(key)) startGameAfterLoad();
        };
        return btn;
    }

    container.appendChild(makeLoadBtn("Continue (Auto‑Save)", SAVE_KEYS.AUTO));
    container.appendChild(makeLoadBtn("Load Slot 1", SAVE_KEYS.SLOT1));
    container.appendChild(makeLoadBtn("Load Slot 2", SAVE_KEYS.SLOT2));
    container.appendChild(makeLoadBtn("Load Slot 3", SAVE_KEYS.SLOT3));

    startScreen.appendChild(container);
}

addStartScreenLoadButtons();

// ===============================
// SAVE BAR (under top bar)
// ===============================

function createSaveBar() {
    const bar = document.createElement("div");
    bar.id = "save-bar";
    bar.style.display = "flex";
    bar.style.justifyContent = "center";
    bar.style.gap = "10px";
    bar.style.margin = "10px 0";

    function makeSaveBtn(label, key) {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.className = "retro-button small";
        btn.style.padding = "6px 15px";
        btn.onclick = () => saveToSlot(key);
        return btn;
    }

    bar.appendChild(makeSaveBtn("Save 1", SAVE_KEYS.SLOT1));
    bar.appendChild(makeSaveBtn("Save 2", SAVE_KEYS.SLOT2));
    bar.appendChild(makeSaveBtn("Save 3", SAVE_KEYS.SLOT3));

    const topBar = document.getElementById("top-bar");
    topBar.insertAdjacentElement("afterend", bar);
}

// ===============================
// START GAME (NEW OR LOADED)
// ===============================

startBtn.addEventListener("click", () => {
    startNewGame();
});

function startNewGame() {
    startScreen.style.display = "none";
    gameScreen.style.display = "block";

    setupDrinkRows();
    rollWeatherForToday();
    rollWeatherForTomorrow();
    updateTopBar();
    updateWeatherPanel();
    updateForecast();
    createSaveBar();
}

function startGameAfterLoad() {
    startScreen.style.display = "none";
    gameScreen.style.display = "block";

    setupDrinkRows();

    // Restore drink settings
    if (window._loadedDrinkSettings) {
        const settings = window._loadedDrinkSettings;

        document.querySelectorAll(".price-input").forEach(input => {
            const id = input.dataset.drinkId;
            if (settings[id]) input.value = settings[id].price;
        });

        document.querySelectorAll(".cups-input").forEach(input => {
            const id = input.dataset.drinkId;
            if (settings[id]) input.value = settings[id].cups;
        });
    }

    updateTopBar();
    updateWeatherPanel();
    updateForecast();
    createSaveBar();
}
// ===============================
// DRINK ROW SETUP
// ===============================

function setupDrinkRows() {
    drinkRows.innerHTML = "";
    drinks.forEach(drink => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.textContent = drink.name;

        const costTd = document.createElement("td");
        costTd.textContent = "$" + drink.baseCost.toFixed(2);

        const priceTd = document.createElement("td");
        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.min = (drink.baseCost * 1.1).toFixed(2);
        priceInput.step = "0.05";
        priceInput.value = (drink.baseCost * 2.5).toFixed(2);
        priceInput.className = "price-input";
        priceInput.dataset.drinkId = drink.id;
        priceTd.appendChild(priceInput);

        const cupsTd = document.createElement("td");
        const cupsInput = document.createElement("input");
        cupsInput.type = "number";
        cupsInput.min = "0";
        cupsInput.step = "10";
        cupsInput.value = "50";
        cupsInput.className = "cups-input";
        cupsInput.dataset.drinkId = drink.id;
        cupsTd.appendChild(cupsInput);

        tr.appendChild(nameTd);
        tr.appendChild(costTd);
        tr.appendChild(priceTd);
        tr.appendChild(cupsTd);

        drinkRows.appendChild(tr);
    });
}

// ===============================
// WEATHER SYSTEM
// ===============================

function randomWeather() {
    const wt = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    const temp = randInt(wt.tempMin, wt.tempMax);
    return {
        name: wt.name,
        icon: wt.icon,
        temp: temp,
        traffic: wt.traffic
    };
}

function rollWeatherForToday() {
    todayWeather = randomWeather();
}

function rollWeatherForTomorrow() {
    tomorrowWeather = randomWeather();
}

function updateWeatherPanel() {
    if (!todayWeather) return;
    weatherIcon.textContent = todayWeather.icon;
    weatherTemp.textContent = todayWeather.temp + "°F";
    weatherDesc.textContent = todayWeather.name;
}

function updateForecast() {
    if (upgrades.radio && tomorrowWeather) {
        forecastText.textContent = "Tomorrow: " + tomorrowWeather.name + " (" + tomorrowWeather.temp + "°F)";
    } else {
        forecastText.textContent = "";
    }
}

// ===============================
// TOP BAR UPDATE
// ===============================

function updateTopBar() {
    dayDisplay.textContent = day;
    cashDisplay.textContent = cash.toFixed(2);
}

// ===============================
// RUN DAY
// ===============================

runDayBtn.addEventListener("click", () => {
    if (day > TOTAL_DAYS) return;
    runDay();
});

function runDay() {
    const priceInputs = document.querySelectorAll(".price-input");
    const cupsInputs = document.querySelectorAll(".cups-input");

    const drinkSettings = {};
    let totalPrepCost = 0;

    priceInputs.forEach(input => {
        const id = input.dataset.drinkId;
        drinkSettings[id] = drinkSettings[id] || {};
        drinkSettings[id].price = parseFloat(input.value) || 0;
    });

    cupsInputs.forEach(input => {
        const id = input.dataset.drinkId;
        drinkSettings[id] = drinkSettings[id] || {};
        drinkSettings[id].cups = parseInt(input.value) || 0;
    });

    // Prep cost
    drinks.forEach(drink => {
        const cups = drinkSettings[drink.id].cups;
        totalPrepCost += cups * drink.baseCost;
    });

    if (totalPrepCost > cash) {
        reportOutput.innerHTML = "<p>You don't have enough cash to prepare that many drinks.</p>";
        return;
    }

    cash -= totalPrepCost;

    // CUSTOMER SIMULATION
    const baseCustomers = randInt(30, 60);
    let trafficMultiplier = todayWeather.traffic;

    if (upgrades.sign) trafficMultiplier += 0.3;
    if (upgrades.storage) trafficMultiplier *= 1.1;

    const totalCustomers = Math.round(baseCustomers * trafficMultiplier);

    let totalRevenue = 0;
    let totalCupsSold = 0;

    let soldByDrink = {};
    let unsoldByDrink = {};
    let feedbackMessages = [];

    drinks.forEach(d => {
        soldByDrink[d.id] = 0;
        unsoldByDrink[d.id] = drinkSettings[d.id].cups;
    });

    for (let i = 0; i < totalCustomers; i++) {
        const customer = randomCustomerType();
        const drink = chooseDrinkForCustomer(customer, todayWeather, drinkSettings);
        if (!drink) continue;

        if (unsoldByDrink[drink.id] <= 0) continue;

        const price = drinkSettings[drink.id].price;
        const maxWilling = drink.baseCost * 4;

        if (price > maxWilling && Math.random() < 0.4) {
            feedbackMessages.push("Some customers thought " + drink.name + " was too expensive.");
            continue;
        }

        if (customer.type === "impatient" && !upgrades.service && Math.random() < 0.25) {
            continue;
        }

        unsoldByDrink[drink.id]--;
        soldByDrink[drink.id]++;
        totalCupsSold++;
        totalRevenue += price;
    }

    cash += totalRevenue;

    // REPORT
    let html = "";
    html += `<p><strong>Prep Cost:</strong> $${totalPrepCost.toFixed(2)}</p>`;
    html += `<p><strong>Revenue:</strong> $${totalRevenue.toFixed(2)}</p>`;
    html += `<p><strong>Net Change:</strong> $${(totalRevenue - totalPrepCost).toFixed(2)}</p>`;
    html += `<p><strong>Total Customers:</strong> ${totalCustomers}</p>`;
    html += `<p><strong>Total Cups Sold:</strong> ${totalCupsSold}</p>`;

    html += "<h4>Sales by Drink</h4><ul>";
    drinks.forEach(d => {
        html += `<li>${d.name}: ${soldByDrink[d.id]} sold, ${unsoldByDrink[d.id]} unsold</li>`;
    });
    html += "</ul>";

    if (feedbackMessages.length > 0) {
        html += "<h4>Customer Feedback</h4><ul>";
        feedbackMessages.slice(0, 4).forEach(msg => {
            html += `<li>${msg}</li>`;
        });
        html += "</ul>";
    }

    reportOutput.innerHTML = html;

    // NEXT DAY
    day++;
    rollWeatherForToday();
    rollWeatherForTomorrow();
    updateTopBar();
    updateWeatherPanel();
    updateForecast();

    autoSave();
    checkEndGame();
}

// ===============================
// CUSTOMER TYPES
// ===============================

function randomCustomerType() {
    const r = Math.random();
    if (r < 0.25) return { type: "thrifty" };
    if (r < 0.45) return { type: "normal" };
    if (r < 0.60) return { type: "impatient" };
    if (r < 0.80) return { type: "loyal" };
    return { type: "trendy" };
}

// ===============================
// DRINK CHOICE LOGIC
// ===============================

function chooseDrinkForCustomer(customer, weather, drinkSettings) {
    const weights = [];

    drinks.forEach(d => {
        const settings = drinkSettings[d.id];
        if (!settings || settings.cups <= 0) return;

        let w = d.baseDemand;

        if (weather.temp >= d.idealTempMin && weather.temp <= d.idealTempMax) {
            w *= 1.3;
        } else {
            w *= 0.9;
        }

        if (d.id === "iced_coffee" && customer.type === "loyal") w *= 1.3;
        if (d.id === "energy" && customer.type === "trendy") w *= 1.3;
        if (d.id === "lemonade" && customer.type === "thrifty") w *= 1.2;

        weights.push({ drink: d, weight: w });
    });

    if (weights.length === 0) return null;

    let total = weights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;

    for (let w of weights) {
        r -= w.weight;
        if (r <= 0) return w.drink;
    }

    return weights[weights.length - 1].drink;
}

// ===============================
// UPGRADES
// ===============================

upgradeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        buyUpgrade(btn.dataset.upgrade, btn);
    });
});

function buyUpgrade(key, btn) {
    if (upgrades[key]) return;

    const prices = {
        sign: 150,
        ingredients: 200,
        service: 150,
        radio: 100,
        storage: 250
    };

    const cost = prices[key];
    if (cash < cost) {
        upgradeMsg.textContent = "Not enough cash for that upgrade.";
        return;
    }

    cash -= cost;
    upgrades[key] = true;
    btn.classList.add("disabled");
    upgradeMsg.textContent = "Upgrade purchased: " + key + "!";
    updateTopBar();
    updateForecast();
}

// ===============================
// END GAME
// ===============================

function checkEndGame() {
    if (cash >= GOAL_AMOUNT) {
        showEndGame(true);
    } else if (day > TOTAL_DAYS) {
        showEndGame(false);
    }
}

function showEndGame(success) {
    endPanel.style.display = "block";

    if (success) {
        endTitle.textContent = "You Did It!";
        endSummary.textContent = `You finished the summer with $${cash.toFixed(2)} and bought your gaming PC.`;
    } else {
        endTitle.textContent = "Summer's Over";
        endSummary.textContent = `You ended the summer with $${cash.toFixed(2)}. You needed $${GOAL_AMOUNT.toFixed(2)} for the gaming PC.`;
    }
}

// ===============================
// HELPERS
// ===============================

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// ===============================
// PART 4 — POLISH & QUALITY OF LIFE
// ===============================

// Timestamp helper
function getTimestamp() {
    const d = new Date();
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
}

// Confirm overwrite
function confirmOverwrite(slotKey, callback) {
    const existing = localStorage.getItem(slotKey);
    if (!existing) {
        callback();
        return;
    }

    if (confirm("Overwrite existing save in this slot?")) {
        callback();
    }
}

// Override saveToSlot with confirmation + timestamp
function saveToSlot(slotKey) {
    confirmOverwrite(slotKey, () => {
        const saveData = buildSaveObject();
        saveData.timestamp = getTimestamp();
        localStorage.setItem(slotKey, JSON.stringify(saveData));
        upgradeMsg.textContent = "Game saved!";
        highlightSaveSlot(slotKey);
    });
}

// Highlight loaded slot
function highlightSaveSlot(slotKey) {
    const bar = document.getElementById("save-bar");
    if (!bar) return;

    const buttons = bar.querySelectorAll("button");
    buttons.forEach(btn => btn.style.boxShadow = "");

    const index = {
        [SAVE_KEYS.SLOT1]: 0,
        [SAVE_KEYS.SLOT2]: 1,
        [SAVE_KEYS.SLOT3]: 2
    }[slotKey];

    if (index !== undefined) {
        buttons[index].style.boxShadow = "0 0 15px #00ff99";
    }
}

// Add Reset Saves button to start screen
function addResetSavesButton() {
    const btn = document.createElement("button");
    btn.textContent = "Reset All Saves";
    btn.className = "retro-button small";
    btn.style.marginTop = "20px";
    btn.style.background = "#ff4444";
    btn.style.boxShadow = "0 0 10px #ff4444";

    btn.onclick = () => {
        if (confirm("Delete ALL save slots and auto-save?")) {
            localStorage.removeItem(SAVE_KEYS.AUTO);
            localStorage.removeItem(SAVE_KEYS.SLOT1);
            localStorage.removeItem(SAVE_KEYS.SLOT2);
            localStorage.removeItem(SAVE_KEYS.SLOT3);
            alert("All saves cleared.");
            location.reload();
        }
    };

    startScreen.appendChild(btn);
}

addResetSavesButton();

// ===============================
// SIMPLE SOUND EFFECTS
// ===============================

const sounds = {
    click: new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA="),
    cash: new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA="),
    upgrade: new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=")
};

// Play click sound on all buttons
document.addEventListener("click", e => {
    if (e.target.tagName === "BUTTON") {
        sounds.click.currentTime = 0;
        sounds.click.play();
    }
});

// Play cash sound after running day
function playCashSound() {
    sounds.cash.currentTime = 0;
    sounds.cash.play();
}

// Play upgrade sound
function playUpgradeSound() {
    sounds.upgrade.currentTime = 0;
    sounds.upgrade.play();
}

// Hook into upgrade purchase
const originalBuyUpgrade = buyUpgrade;
buyUpgrade = function(key, btn) {
    originalBuyUpgrade(key, btn);
    if (upgrades[key]) playUpgradeSound();
};

// Hook into revenue
const originalRunDay = runDay;
runDay = function() {
    const before = cash;
    originalRunDay();
    if (cash > before) playCashSound();
};

// ===============================
// FADE-IN ANIMATION
// ===============================

document.body.style.opacity = 0;
document.body.style.transition = "opacity 0.8s ease-in-out";

window.onload = () => {
    document.body.style.opacity = 1;
};
