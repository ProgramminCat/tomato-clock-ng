import browser from "webextension-polyfill";

import "bootstrap/dist/css/bootstrap.min.css";
import "./sessionNote.css";

import Settings from "../utils/settings";
import Timeline from "../utils/timeline";
import { MOTIVATIONAL_QUOTES, RUNTIME_ACTION, TIMER_TYPE } from "../utils/constants";

export default class SessionNote {
  constructor() {
    this.settings = new Settings();
    this.timeline = new Timeline();

    this.sessionNoteInput = document.getElementById("session-note-input");
    this.saveNoteButton = document.getElementById("save-note-button");
    this.skipNoteButton = document.getElementById("skip-note-button");
    this.charCount = document.getElementById("char-count");
    this.motivationalQuote = document.getElementById("motivational-quote");
    this.motivationalQuoteSection = document.getElementById("motivational-quote-section");
    this.sessionTypeElement = document.getElementById("session-type");
    this.startTomatoButton = document.getElementById("start-tomato-button");
    this.startBreakButton = document.getElementById("start-break-button");

    this.sessionData = null;

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
      } catch (error) {
        console.error("Error parsing session data:", error);
      }
    }

    // Apply dark mode
    await this.applyDarkMode();

    // Show motivational quote
    await this.showMotivationalQuote();

    // Set up event listeners
    this.setEventListeners();

    // Focus on textarea
    this.sessionNoteInput.focus();

    // Listen for settings changes
    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" || areaName === "local") {
        if (changes.settings) {
          this.applyDarkMode();
        }
      }
    });
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
