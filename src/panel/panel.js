import browser from "webextension-polyfill";

import "bootstrap/dist/css/bootstrap.min.css";
import "./panel.css";

import { RUNTIME_ACTION, TIMER_TYPE } from "../utils/constants";
import {
  getMillisecondsToTimeText,
  getSecondsInMilliseconds,
  getTimerTypeMilliseconds,
} from "../utils/utils";
import Settings from "../utils/settings";
import Tasks from "../utils/tasks";

export default class Panel {
  constructor() {
    this.settings = new Settings();
    this.tasks = new Tasks();
    this.currentTimeText = document.getElementById("current-time-text");
    this.presetSelect = document.getElementById("preset-select");
    this.taskSelect = document.getElementById("task-select");
    this.timer = {};

    browser.runtime
      .sendMessage({
        action: RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME,
      })
      .then((scheduledTime) => {
        if (scheduledTime) {
          this.setDisplayTimer(scheduledTime - Date.now());
        }
      });

    this.setEventListeners();
    this.setPresetFromSettings();
    this.loadTasks();
  }

  setEventListeners() {
    if (this.presetSelect) {
      this.presetSelect.addEventListener("change", (e) => {
        this.onPresetChange(e.target.value);
      });
    }
    document.getElementById("tomato-button").addEventListener("click", () => {
      const selectedTaskId = this.taskSelect.value || null;
      this.setTimer(TIMER_TYPE.TOMATO);
      this.setBackgroundTimer(TIMER_TYPE.TOMATO, selectedTaskId);
    });

    document
      .getElementById("short-break-button")
      .addEventListener("click", () => {
        this.setTimer(TIMER_TYPE.SHORT_BREAK);
        this.setBackgroundTimer(TIMER_TYPE.SHORT_BREAK);
      });

    document
      .getElementById("long-break-button")
      .addEventListener("click", () => {
        this.setTimer(TIMER_TYPE.LONG_BREAK);
        this.setBackgroundTimer(TIMER_TYPE.LONG_BREAK);
      });

    document.getElementById("reset-button").addEventListener("click", () => {
      this.resetTimer();
      this.resetBackgroundTimer();
    });

    document.getElementById("tasks-link").addEventListener("click", () => {
      browser.tabs.create({ url: "/tasks/tasks.html" });
    });

    document.getElementById("stats-link").addEventListener("click", () => {
      browser.tabs.create({ url: "/stats/stats.html" });
    });

    document.getElementById("options-link").addEventListener("click", () => {
      browser.runtime.openOptionsPage();
    });
  }

  async loadTasks() {
    if (!this.taskSelect) return;

    const tasks = await this.tasks.getActiveTasks();

    // Clear existing options except the first one
    this.taskSelect.innerHTML = '<option value="">No Task Selected</option>';

    // Add task options
    tasks.forEach((task) => {
      const option = document.createElement("option");
      option.value = task.id;
      option.textContent = task.name;
      this.taskSelect.appendChild(option);
    });
  }

  setPresetFromSettings() {
    if (!this.presetSelect) return;

    this.settings.getSettings().then((settings) => {
      const { minutesInTomato, minutesInShortBreak, minutesInLongBreak } =
        settings;

      const triplet = `${minutesInTomato}-${minutesInShortBreak}-${minutesInLongBreak}`;

      switch (triplet) {
        case "25-5-15":
          this.presetSelect.value = "25-5-15";
          break;
        case "45-15-30":
          this.presetSelect.value = "45-15-30";
          break;
        case "90-30-45":
          this.presetSelect.value = "90-30-45";
          break;
        default:
          this.presetSelect.value = "default";
      }
    });
  }

  onPresetChange(value) {
    if (value === "default") return;

    const map = {
      "25-5-15": [25, 5, 15],
      "45-15-30": [45, 15, 30],
      "90-30-45": [90, 30, 45],
    };

    const preset = map[value];
    if (!preset) return;

    const [minutesInTomato, minutesInShortBreak, minutesInLongBreak] = preset;

    this.settings.saveSettings({
      minutesInTomato,
      minutesInShortBreak,
      minutesInLongBreak,
    });
  }

  resetTimer() {
    if (this.timer.interval) {
      clearInterval(this.timer.interval);
    }

    this.timer = {
      interval: null,
      timeLeft: 0,
    };

    this.setCurrentTimeText(0);
  }

  getTimer() {
    return this.timer;
  }

  setTimer(type) {
    this.settings.getSettings().then((settings) => {
      const milliseconds = getTimerTypeMilliseconds(type, settings);
      this.setDisplayTimer(milliseconds);
    });
  }

  setDisplayTimer(milliseconds) {
    this.resetTimer();
    this.setCurrentTimeText(milliseconds);

    this.timer = {
      interval: setInterval(() => {
        const timer = this.getTimer();

        timer.timeLeft -= getSecondsInMilliseconds(1);
        this.setCurrentTimeText(timer.timeLeft);

        if (timer.timeLeft <= 0) {
          this.resetTimer();
        }
      }, getSecondsInMilliseconds(1)),
      timeLeft: milliseconds,
    };
  }

  setCurrentTimeText(milliseconds) {
    this.currentTimeText.textContent = getMillisecondsToTimeText(milliseconds);
  }

  resetBackgroundTimer() {
    browser.runtime.sendMessage({
      action: RUNTIME_ACTION.RESET_TIMER,
    });
  }

  setBackgroundTimer(type, taskId = null) {
    browser.runtime.sendMessage({
      action: RUNTIME_ACTION.SET_TIMER,
      data: {
        type,
        taskId,
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Panel();
});
