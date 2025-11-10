import browser from "webextension-polyfill";

import "bootstrap/dist/css/bootstrap.min.css";
import "./achievements.css";

import Gamification, { BADGES, LEVELS } from "../utils/gamification";
import Settings from "../utils/settings";

const gamification = new Gamification();
const settings = new Settings();

let currentFilter = "all";
let currentTierFilter = null;

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  await loadGamificationData();
  setupEventListeners();
  applyDarkMode();

  // Listen for gamification updates
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "gamification-update") {
      loadGamificationData();
    }
  });
});

async function loadGamificationData() {
  try {
    const data = await gamification.getData();
    displayLevelProgress(data);
    displayQuickStats(data);
    await displayBadges();
    displayLevelMilestones(data);
  } catch (error) {
    console.error("Error loading gamification data:", error);
  }
}

function displayLevelProgress(data) {
  const levelInfo = gamification.getLevelInfo(data.level);
  const progress = gamification.getProgressToNextLevel(data.xp, data.level);

  document.getElementById("level-icon").textContent = levelInfo.icon;
  document.getElementById("current-level").textContent = data.level;
  document.getElementById("level-name").textContent = levelInfo.name;
  document.getElementById("total-xp").textContent = data.xp.toLocaleString();

  if (progress.xpTotal) {
    document.getElementById("level-progress-bar").style.width =
      `${progress.percentage}%`;
    document.getElementById("level-progress-text").textContent =
      `${progress.percentage}%`;
    document.getElementById("current-xp").textContent =
      progress.xpCurrent.toLocaleString();
    document.getElementById("next-level-xp").textContent =
      progress.xpNeeded.toLocaleString();
  } else {
    // Max level
    document.getElementById("level-progress-bar").style.width = "100%";
    document.getElementById("level-progress-text").textContent = "MAX";
    document.getElementById("current-xp").textContent =
      data.xp.toLocaleString();
    document.getElementById("next-level-xp").textContent = "MAX";
  }
}

function displayQuickStats(data) {
  document.getElementById("stat-tomatoes").textContent =
    data.stats.tomatoesCompleted.toLocaleString();
  document.getElementById("stat-current-streak").textContent =
    data.stats.currentStreak;
  document.getElementById("stat-longest-streak").textContent =
    data.stats.longestStreak;
  document.getElementById("stat-badges-earned").textContent =
    data.earnedBadges.length;
  document.getElementById("stat-badges-total").textContent =
    Object.keys(BADGES).length;
}

async function displayBadges() {
  const badgesWithStatus = await gamification.getAllBadgesWithStatus();
  const container = document.getElementById("badges-container");

  // Apply filters
  let filteredBadges = badgesWithStatus;

  if (currentFilter === "earned") {
    filteredBadges = filteredBadges.filter((b) => b.earned);
  } else if (currentFilter === "locked") {
    filteredBadges = filteredBadges.filter((b) => !b.earned);
  }

  if (currentTierFilter) {
    filteredBadges = filteredBadges.filter((b) => b.tier === currentTierFilter);
  }

  // Sort: earned first, then by tier, then by progress
  filteredBadges.sort((a, b) => {
    if (a.earned !== b.earned) return b.earned ? 1 : -1;

    const tierOrder = {
      diamond: 5,
      platinum: 4,
      gold: 3,
      silver: 2,
      bronze: 1,
    };
    const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
    if (tierDiff !== 0) return tierDiff;

    return b.progress.percentage - a.progress.percentage;
  });

  container.innerHTML = "";

  filteredBadges.forEach((badge) => {
    const badgeCard = createBadgeCard(badge);
    container.appendChild(badgeCard);
  });

  if (filteredBadges.length === 0) {
    container.innerHTML =
      '<div class="col-12 text-center"><p class="text-muted">No badges match your filters.</p></div>';
  }
}

function createBadgeCard(badge) {
  const col = document.createElement("div");
  col.className = "col";

  const card = document.createElement("div");
  card.className = `badge-card ${badge.earned ? "earned" : "locked"}`;

  if (badge.earned) {
    const earnedLabel = document.createElement("div");
    earnedLabel.className = "earned-badge";
    earnedLabel.textContent = "✓ Earned";
    card.appendChild(earnedLabel);
  }

  const icon = document.createElement("div");
  icon.className = "badge-icon";
  icon.textContent = badge.icon;
  card.appendChild(icon);

  const tier = document.createElement("div");
  tier.className = `badge-tier ${badge.tier}`;
  tier.textContent = badge.tier;
  tier.style.textAlign = "center";
  card.appendChild(tier);

  const name = document.createElement("div");
  name.className = "badge-name";
  name.textContent = badge.name;
  card.appendChild(name);

  const description = document.createElement("div");
  description.className = "badge-description";
  description.textContent = badge.description;
  card.appendChild(description);

  if (!badge.earned) {
    const progressContainer = document.createElement("div");
    progressContainer.className = "badge-progress";

    const progressText = document.createElement("div");
    progressText.className = "badge-progress-text";
    progressText.textContent = `${badge.progress.current} / ${badge.progress.total}`;
    progressContainer.appendChild(progressText);

    const progressBar = document.createElement("div");
    progressBar.className = "badge-progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "badge-progress-fill";
    progressFill.style.width = `${badge.progress.percentage}%`;
    progressBar.appendChild(progressFill);

    progressContainer.appendChild(progressBar);
    card.appendChild(progressContainer);
  }

  col.appendChild(card);
  return col;
}

function displayLevelMilestones(data) {
  const tbody = document.getElementById("levels-table-body");
  tbody.innerHTML = "";

  LEVELS.forEach((level) => {
    const row = document.createElement("tr");

    let statusClass = "";
    let status = "";

    if (level.level < data.level) {
      statusClass = "level-achieved";
      status = '<span class="status-badge status-achieved">✓ Achieved</span>';
    } else if (level.level === data.level) {
      statusClass = "level-current";
      status = '<span class="status-badge status-current">Current</span>';
    } else {
      statusClass = "";
      status = '<span class="status-badge status-locked">🔒 Locked</span>';
    }

    row.className = statusClass;

    row.innerHTML = `
      <td><strong>Level ${level.level}</strong></td>
      <td class="level-icon-cell">${level.icon}</td>
      <td>${level.name}</td>
      <td>${level.xpRequired.toLocaleString()} XP</td>
      <td>${status}</td>
    `;

    tbody.appendChild(row);
  });
}

function setupEventListeners() {
  // Filter buttons
  document.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      displayBadges();
    });
  });

  // Tier filter buttons
  document.querySelectorAll("[data-tier]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tier = e.target.dataset.tier;

      if (currentTierFilter === tier) {
        // Deselect
        currentTierFilter = null;
        e.target.classList.remove("active");
      } else {
        // Select
        document
          .querySelectorAll("[data-tier]")
          .forEach((b) => b.classList.remove("active"));
        currentTierFilter = tier;
        e.target.classList.add("active");
      }

      displayBadges();
    });
  });

  // Export button
  document
    .getElementById("export-achievements-button")
    .addEventListener("click", async () => {
      try {
        const data = await gamification.exportGamificationData();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.getElementById("downloadAnchorElem");
        const date = new Date().toISOString().split("T")[0];
        a.href = url;
        a.download = `tomato-clock-achievements-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert("Achievements data exported successfully!");
      } catch (error) {
        console.error("Error exporting achievements:", error);
        alert("Failed to export achievements data.");
      }
    });

  // Import button
  document
    .getElementById("import-achievements-button")
    .addEventListener("click", () => {
      document.getElementById("import-achievements-hidden-input").click();
    });

  document
    .getElementById("import-achievements-hidden-input")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const result = await gamification.importGamificationData(text);

        if (result.success) {
          alert("Achievements data imported successfully!");
          await loadGamificationData();
        } else {
          alert(`Failed to import achievements data: ${result.error}`);
        }
      } catch (error) {
        console.error("Error importing achievements:", error);
        alert("Failed to import achievements data.");
      }

      e.target.value = "";
    });

  // Reset button
  document
    .getElementById("reset-achievements-button")
    .addEventListener("click", async () => {
      const confirmed = confirm(
        "Are you sure you want to reset all achievements? This action cannot be undone!",
      );

      if (confirmed) {
        try {
          await gamification.resetGamification();
          alert("All achievements have been reset.");
          await loadGamificationData();
        } catch (error) {
          console.error("Error resetting achievements:", error);
          alert("Failed to reset achievements.");
        }
      }
    });
}

async function applyDarkMode() {
  try {
    const settingsData = await settings.getSettings();
    if (settingsData.isDarkModeEnabled) {
      document.body.classList.add("dark-mode");
    }
  } catch (error) {
    console.error("Error applying dark mode:", error);
  }
}
