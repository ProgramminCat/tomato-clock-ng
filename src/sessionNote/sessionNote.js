import browser from "webextension-polyfill";

import "bootstrap/dist/css/bootstrap.min.css";
import "./sessionNote.css";

import Settings from "../utils/settings";
import Timeline from "../utils/timeline";
import Gamification from "../utils/gamification";
import {
  MOTIVATIONAL_QUOTES,
  RUNTIME_ACTION,
  TIMER_TYPE,
} from "../utils/constants";

export default class SessionNote {
  constructor() {
    this.settings = new Settings();
    this.timeline = new Timeline();
    this.gamification = new Gamification();

    this.sessionNoteInput = document.getElementById("session-note-input");
    this.saveNoteButton = document.getElementById("save-note-button");
    this.skipNoteButton = document.getElementById("skip-note-button");
    this.charCount = document.getElementById("char-count");
    this.motivationalQuote = document.getElementById("motivational-quote");
    this.motivationalQuoteSection = document.getElementById(
      "motivational-quote-section",
    );
    this.sessionTypeElement = document.getElementById("session-type");
    this.startTomatoButton = document.getElementById("start-tomato-button");
    this.startBreakButton = document.getElementById("start-break-button");

    this.sessionData = null;
    this.gamificationData = null;

    this.init();
  }

  async init() {
    // Load session data from URL parameters
    const params = new URLSearchParams(window.location.search);
    const sessionDataStr = params.get("sessionData");

    if (sessionDataStr) {
      try {
        this.sessionData = JSON.parse(decodeURIComponent(sessionDataStr));
        this.updateSessionInfo();

        // Check if gamification data is included in session data
        if (this.sessionData.gamificationData) {
          this.gamificationData = this.sessionData.gamificationData;
        }
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    }

    // Apply dark mode
    await this.applyDarkMode();

    // Show motivational quote
    await this.showMotivationalQuote();

    // Load and display gamification rewards
    await this.loadGamificationRewards();

    // Set up event listeners
    this.setEventListeners();

    // Focus on textarea
    this.sessionNoteInput.focus();


    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" || areaName === "local") {
        if (changes.settings) {
          this.applyDarkMode();
        }
      }
    });

    browser.runtime.onMessage.addListener((message) => {
      if (message.type === "gamification-update") {
        this.displayGamificationRewards(message.data);
      }
    });
  }

  async loadGamificationRewards() {
    try {
      if (this.gamificationData) {
        this.displayGamificationRewards(this.gamificationData);
        return;
      }

      // Otherwise, try to load recent data from storage
      const data = await this.gamification.getData();

      const recentBadges = await this.gamification.getRecentBadges(3);

      this.gamificationData = {
        xpResult: null,
        newBadges: recentBadges.filter((badge) => {
          const earnedAt = new Date(badge.earnedAt);
          const now = new Date();
          return now - earnedAt < 60000;
        }),
        currentStreak: data.stats.currentStreak,
      };

      this.displayGamificationRewards(this.gamificationData);
    } catch (error) {
      console.error("Error loading gamification rewards:", error);
    }
  }

  displayGamificationRewards(data) {
    if (!data) return;

    const rewardsSection = document.getElementById("rewards-section");
    let hasRewards = false;

    if (data.xpResult && data.xpResult.amount) {
      const xpEarnedElement = document.getElementById("xp-earned");
      if (xpEarnedElement) {
        xpEarnedElement.textContent = `+${data.xpResult.amount}`;
        hasRewards = true;
      }

      if (data.xpResult.leveledUp) {
        const levelUpBanner = document.getElementById("level-up-banner");
        const newLevelElement = document.getElementById("new-level");
        const newLevelNameElement = document.getElementById("new-level-name");

        if (levelUpBanner && newLevelElement && newLevelNameElement) {
          newLevelElement.textContent = data.xpResult.level;
          const levelInfo = this.gamification.getLevelInfo(data.xpResult.level);
          newLevelNameElement.textContent = levelInfo.name;
          levelUpBanner.style.display = "block";
          hasRewards = true;
        }
      }
    } else if (data.xpBreakdown && data.xpBreakdown.length > 0) {
      const totalXP = data.xpBreakdown.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const xpEarnedElement = document.getElementById("xp-earned");
      if (xpEarnedElement && totalXP > 0) {
        xpEarnedElement.textContent = `+${totalXP}`;
        hasRewards = true;
      }
    }

    // Display new badges
    if (data.newBadges && data.newBadges.length > 0) {
      const badgesSection = document.getElementById("badges-earned-section");
      const badgesContainer = document.getElementById(
        "badges-earned-container",
      );

      if (badgesSection && badgesContainer) {
        badgesContainer.innerHTML = "";
        data.newBadges.forEach((badge) => {
          const badgeElement = document.createElement("div");
          badgeElement.className = "badge-earned-item";
          badgeElement.innerHTML = `
            <span class="badge-icon-large">${badge.icon}</span>
            <span class="badge-name-small">${badge.name}</span>
          `;
          badgesContainer.appendChild(badgeElement);
        });
        badgesSection.style.display = "block";
        hasRewards = true;
      }
    }

    // Display streak info
    if (data.currentStreak && data.currentStreak > 0) {
      const streakInfo = document.getElementById("streak-info");
      const currentStreakElement = document.getElementById("current-streak");

      if (streakInfo && currentStreakElement) {
        currentStreakElement.textContent = data.currentStreak;
        streakInfo.style.display = "block";
        hasRewards = true;
      }
    }

    // Show rewards section if there are any rewards
    if (hasRewards && rewardsSection) {
      rewardsSection.style.display = "block";
    }
  }

  async applyDarkMode() {
    const settings = await this.settings.getSettings();

    if (settings.isDarkModeEnabled) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  async showMotivationalQuote() {
    const settings = await this.settings.getSettings();

    if (settings.isMotivationalQuotesEnabled) {
      const randomQuote =
        MOTIVATIONAL_QUOTES[
          Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
        ];
      this.motivationalQuote.textContent = `"${randomQuote}"`;
      this.motivationalQuoteSection.style.display = "block";
    } else {
      this.motivationalQuoteSection.style.display = "none";
    }
  }

  updateSessionInfo() {
    if (this.sessionData && this.sessionData.type) {
      const typeLabels = {
        tomato: "tomato",
        shortBreak: "short break",
        longBreak: "long break",
      };
      this.sessionTypeElement.textContent =
        typeLabels[this.sessionData.type] || "session";
    }
  }

  setEventListeners() {
    // Character counter
    this.sessionNoteInput.addEventListener("input", () => {
      this.charCount.textContent = this.sessionNoteInput.value.length;
    });

    // Save note button
    this.saveNoteButton.addEventListener("click", () => {
      this.handleSaveNote();
    });

    // Skip note button
    this.skipNoteButton.addEventListener("click", () => {
      this.handleSkipNote();
    });

    // Enter key to save (Ctrl+Enter or Cmd+Enter)
    this.sessionNoteInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        this.handleSaveNote();
      }
    });

    // Quick action buttons
    this.startTomatoButton.addEventListener("click", () => {
      this.startNewTimer(TIMER_TYPE.TOMATO);
    });

    this.startBreakButton.addEventListener("click", () => {
      // Determine if it should be short or long break
      // For simplicity, default to short break
      this.startNewTimer(TIMER_TYPE.SHORT_BREAK);
    });
  }

  async handleSaveNote() {
    const note = this.sessionNoteInput.value.trim();

    if (note && this.sessionData) {
      await this.addNoteToLastSession(note);
    }

    window.close();
  }

  handleSkipNote() {
    window.close();
  }

  async addNoteToLastSession(note) {
    try {
      const timeline = await this.timeline.getTimeline();

      if (timeline.length > 0) {
        const lastEntry = timeline[timeline.length - 1];

        if (
          lastEntry.type === this.sessionData.type &&
          Math.abs(lastEntry.duration - this.sessionData.totalTime) < 5000
        ) {
          lastEntry.note = note;

          const rawTimeline = await browser.storage.local.get("timeline");
          if (rawTimeline.timeline && rawTimeline.timeline.length > 0) {
            const rawEntry =
              rawTimeline.timeline[rawTimeline.timeline.length - 1];
            rawEntry.note = note;

            await browser.storage.local.set({
              timeline: rawTimeline.timeline,
            });

            console.log("Note saved successfully");
          }
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }

  startNewTimer(type) {
    browser.runtime.sendMessage({
      action: RUNTIME_ACTION.SET_TIMER,
      data: {
        type,
        taskId: null,
      },
    });

    window.close();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new SessionNote();
});
