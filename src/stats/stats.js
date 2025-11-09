import $ from "jquery";
import { Chart, registerables } from "chart.js";
import moment from "moment";
import "daterangepicker";
import { Calendar } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";

import "bootstrap/dist/css/bootstrap.min.css";
import "daterangepicker/daterangepicker.css";
import "./stats.css";

import Timeline from "../utils/timeline";
import Tasks from "../utils/tasks";
import Settings from "../utils/settings";
import {
  getDateLabel,
  getDateRangeStringArray,
  getZeroArray,
  getFilenameDate,
} from "../utils/utils";
import {
  DATE_UNIT,
  TIMER_TYPE,
  TIME_OF_DAY,
  TIME_OF_DAY_LABELS,
} from "../utils/constants";
import {
  analyzeProductivityByTimeOfDay,
  getMostProductiveTimeOfDay,
  formatTimeOfDayStats,
} from "../utils/timeAnalysis";

Chart.register(...registerables);

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "timer-finished") {
    window.location.reload();
  }
});

export default class Stats {
  constructor() {
    // Get DOM Elements
    this.tomatoesCount = document.getElementById("tomatoes-count");
    this.shortBreaksCount = document.getElementById("short-breaks-count");
    this.longBreaksCount = document.getElementById("long-breaks-count");
    this.resetStatsButton = document.getElementById("reset-stats-button");
    this.exportStatsButton = document.getElementById("export-stats-button");
    this.importStatsButton = document.getElementById("import-stats-button");
    this.importStatsHiddenInput = document.getElementById(
      "import-stats-hidden-input",
    );
    this.totalTomatoMinutes = document.getElementById("total-tomato-minutes");
    this.averageTomatoMinutesDay = document.getElementById(
      "average-tomato-minutes-day",
    );
    this.averageTomatoMinutesWeek = document.getElementById(
      "average-tomato-minutes-week",
    );
    this.averageTomatoMinutesMonth = document.getElementById(
      "average-tomato-minutes-month",
    );
    this.taskStatsBody = document.getElementById("task-stats-body");
    this.timeOfDayStatsBody = document.getElementById("time-of-day-stats-body");
    this.mostProductiveTime = document.getElementById("most-productive-time");
    this.sessionHistoryList = document.getElementById("session-history-list");
    this.sessionHistoryLimit = document.getElementById("session-history-limit");

    this.ctx = document
      .getElementById("completed-tomato-dates-chart")
      .getContext("2d");
    this.completedTomatoesChart = null;

    this.timeOfDayCtx = document
      .getElementById("time-of-day-chart")
      .getContext("2d");
    this.timeOfDayChart = null;

    this.handleResetStatsButtonClick =
      this.handleResetStatsButtonClick.bind(this);
    this.handleExportStatsButtonClick =
      this.handleExportStatsButtonClick.bind(this);
    this.handleImportStatsButtonClick =
      this.handleImportStatsButtonClick.bind(this);
    this.handleImportStatsHiddenInputChange =
      this.handleImportStatsHiddenInputChange.bind(this);
    this.resetStatsButton.addEventListener(
      "click",
      this.handleResetStatsButtonClick,
    );
    this.exportStatsButton.addEventListener(
      "click",
      this.handleExportStatsButtonClick,
    );
    this.importStatsHiddenInput.addEventListener(
      "change",
      this.handleImportStatsHiddenInputChange,
    );

    this.timeline = new Timeline();
    this.tasks = new Tasks();
    this.settings = new Settings();
    this.resetDateRange();
    this.applyDarkMode();

    this.importLegacyStatsButton = document.getElementById(
      "import-legacy-stats-button",
    );

    this.importStatsButton.addEventListener("click", () => {
      this.importStatsHiddenInput.dataset.format = "new";
      this.importStatsHiddenInput.click();
    });
    this.importLegacyStatsButton.addEventListener("click", () => {
      this.importStatsHiddenInput.dataset.format = "legacy";
      this.importStatsHiddenInput.click();
    });
    this.importStatsHiddenInput.addEventListener(
      "change",
      this.handleImportStatsHiddenInputChange.bind(this),
    );

    browser.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "sync" || areaName === "local") {
        if (changes.settings) {
          this.applyDarkMode();
        }
      }
    });

    if (this.sessionHistoryLimit) {
      this.sessionHistoryLimit.addEventListener("change", () => {
        this.loadSessionHistory();
      });
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

  handleResetStatsButtonClick() {
    if (confirm("Are you sure you want to reset your stats?")) {
      this.timeline.resetTimeline().then(() => {
        this.resetDateRange();
      });
    }
  }

  handleExportStatsButtonClick() {
    this.timeline.getTimeline().then((timeline) => {
      let processedData = timeline || [];
      let exportVersion = browser.runtime.getManifest().version;
      let specificationUrl =
        "https://github.com/ProgramminCat/tomato-clock-ng/?tab=readme-ov-file#statistics-json-format";

      // detect if legacy format and convert to new format
      if (
        Array.isArray(timeline) &&
        timeline.length > 0 &&
        "date" in timeline[0]
      ) {
        processedData = timeline.map((item) => {
          const startTime = new Date(item.date).toISOString();
          const endTime = new Date(
            new Date(item.date).getTime() + item.timeout,
          ).toISOString();
          return {
            type: item.type,
            startTime: startTime,
            endTime: endTime,
            duration: item.timeout,
          };
        });
      }

      const exportObject = {
        specificationUrl: specificationUrl,
        version: exportVersion,
        exportedAt: new Date().toISOString(),
        data: processedData,
      };

      const filename = `${getFilenameDate()}_tomato-clock-ng-stats.json`;
      const dataStr =
        "data:application/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const dlAnchorElem =
        document.getElementById("downloadAnchorElem") ||
        document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", filename);
      dlAnchorElem.style.display = "none";
      document.body.appendChild(dlAnchorElem);
      dlAnchorElem.click();
      document.body.removeChild(dlAnchorElem);
    });
  }

  handleImportStatsButtonClick() {
    this.importStatsHiddenInput.click();
  }

  async handleImportStatsHiddenInputChange(e) {
    const [file] = e.target.files;
    if (!file) return;

    const fileContent = await file.text();
    let imported;

    try {
      imported = JSON.parse(fileContent);
    } catch (err) {
      alert("Invalid JSON structure.");
      e.target.value = "";
      return;
    }

    let timelineArr;
    if (Array.isArray(imported)) {
      // Legacy
      timelineArr = imported;
    } else if (imported.version && Array.isArray(imported.data)) {
      // New format
      timelineArr = imported.data;
    } else {
      alert("Unrecognized JSON. Try exporting your stats first.");
      e.target.value = "";
      return;
    }

    // Validate entries
    if (
      !timelineArr.every(
        (entry) =>
          entry &&
          entry.type &&
          (entry.date || entry.startTime || entry.endTime),
      )
    ) {
      alert(
        "The imported data does not appear to be valid Tomato Clock stats.",
      );
      e.target.value = "";
      return;
    }

    // Save to browser.storage.local
    if (
      typeof browser !== "undefined" &&
      browser.storage &&
      browser.storage.local
    ) {
      await browser.storage.local.set({ timeline: timelineArr });
    } else if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set({ timeline: timelineArr });
    }

    // Update timeline object
    if (this.timeline) this.timeline.timeline = timelineArr;

    alert("Import successful!");
    window.location.reload();
  }

  resetDateRange() {
    const momentLastWeek = moment().subtract(6, "days");
    const momentToday = moment();

    this.changeStatDates(momentLastWeek.toDate(), momentToday.toDate());
  }

  addTomatoDateToChartData(data, date, dateUnit) {
    for (let i = 0; i < data.labels.length; i++) {
      if (data.labels[i] === getDateLabel(date, dateUnit)) {
        data.datasets[0].data[i]++;
        break;
      }
    }
  }

  setStatsText(stats) {
    this.tomatoesCount.textContent = stats.tomatoes;
    this.shortBreaksCount.textContent = stats.shortBreaks;
    this.longBreaksCount.textContent = stats.longBreaks;

    this.totalTomatoMinutes.textContent = stats.totalTomatoMinutes.toFixed(1);
    this.averageTomatoMinutesDay.textContent =
      stats.averageTomatoMinutesDay.toFixed(1);
    this.averageTomatoMinutesWeek.textContent =
      stats.averageTomatoMinutesWeek.toFixed(1);
    this.averageTomatoMinutesMonth.textContent =
      stats.averageTomatoMinutesMonth.toFixed(1);
  }

  async changeStatDates(startDate, endDate, dateUnit) {
    const filteredTimeline = await this.timeline.getFilteredTimeline(
      startDate,
      endDate,
    );
    const dateRangeStrings = getDateRangeStringArray(
      startDate,
      endDate,
      dateUnit,
    );

    const completedTomatoesChartData = {
      labels: dateRangeStrings,
      datasets: [
        {
          label: "Tomatoes",
          fill: true,
          borderColor: "rgba(255,0,0,1)",
          backgroundColor: "rgba(255,0,0,0.2)",
          pointBorderColor: "#fff",
          pointBackgroundColor: "rgba(255,0,0,1)",
          data: getZeroArray(dateRangeStrings.length),
        },
      ],
    };

    const stats = {
      tomatoes: 0,
      shortBreaks: 0,
      longBreaks: 0,
      totalTomatoMinutes: 0,
      averageTomatoMinutesDay: 0,
      averageTomatoMinutesWeek: 0,
      averageTomatoMinutesMonth: 0,
    };

    for (let timelineAlarm of filteredTimeline) {
      if (timelineAlarm.type === TIMER_TYPE.TOMATO) {
        stats.tomatoes++;
        const durationMin = (timelineAlarm.duration || 0) / 60000;
        stats.totalTomatoMinutes += durationMin;
        const eventDate = timelineAlarm.endTime
          ? new Date(timelineAlarm.endTime)
          : timelineAlarm.date
            ? new Date(timelineAlarm.date)
            : null;
        if (eventDate) {
          this.addTomatoDateToChartData(
            completedTomatoesChartData,
            eventDate,
            dateUnit,
          );
        }
      } else if (timelineAlarm.type === TIMER_TYPE.SHORT_BREAK) {
        stats.shortBreaks++;
      } else if (timelineAlarm.type === TIMER_TYPE.LONG_BREAK) {
        stats.longBreaks++;
      }
    }

    // calc averages
    const totalDays = moment(endDate).diff(moment(startDate), "days") + 1;
    const totalWeeks = totalDays / 7;
    const totalMonths = totalDays / 30;

    if (totalDays > 0) {
      stats.averageTomatoMinutesDay = stats.totalTomatoMinutes / totalDays;
      stats.averageTomatoMinutesWeek = stats.totalTomatoMinutes / totalWeeks;
      stats.averageTomatoMinutesMonth = stats.totalTomatoMinutes / totalMonths;
    }

    this.setStatsText(stats);

    if (this.completedTomatoesChart) {
      this.completedTomatoesChart.config.data = completedTomatoesChartData;
      this.completedTomatoesChart.update();
    } else {
      this.completedTomatoesChart = new Chart(this.ctx, {
        type: "line",
        data: completedTomatoesChartData,
        options: {
          tooltips: { intersect: false, mode: "nearest" },
          scales: { y: { beginAtZero: true, suggestedMax: 5 } },
          legend: { position: "bottom" },
        },
      });
    }

    renderStatsCalendar(filteredTimeline);

    // streak stuff below

    const fullTimeline =
      this.timeline.timeline || (await this.timeline.getTimeline());
    const tomatoMinutesPerDay = {};
    fullTimeline.forEach((entry) => {
      if (entry.type === TIMER_TYPE.TOMATO) {
        const dateObj = entry.endTime
          ? new Date(entry.endTime)
          : entry.date
            ? new Date(entry.date)
            : null;
        if (dateObj) {
          const dateStr = dateObj.toISOString().split("T")[0];
          tomatoMinutesPerDay[dateStr] =
            (tomatoMinutesPerDay[dateStr] || 0) + (entry.duration || 0) / 60000;
        }
      }
    });

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    const momentList = [];
    for (
      let m = moment(startDate).clone();
      m.isSameOrBefore(moment(endDate), "day");
      m.add(1, "days")
    ) {
      momentList.push(m.clone());
    }

    momentList.forEach((m, idx) => {
      const dateStr = m.format("YYYY-MM-DD");
      const hasTomato = (tomatoMinutesPerDay[dateStr] || 0) >= 1; // TODO: make minimum minutes per day configurable
      if (hasTomato) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        if (idx === momentList.length - 1) currentStreak = tempStreak;
      } else {
        tempStreak = 0;
        if (idx === momentList.length - 1) currentStreak = 0;
      }
    });

    stats.longestStreak = longestStreak;
    stats.currentStreak = currentStreak;

    document.getElementById("longest-streak-count").textContent =
      stats.longestStreak;
    document.getElementById("current-streak-count").textContent =
      stats.currentStreak;

    
    this.loadTaskStats(startDate, endDate);

    this.loadTimeOfDayStats(startDate, endDate);

    this.loadSessionHistory();
  }

  async loadTaskStats(startDate, endDate) {
    const filteredTimeline = await this.timeline.getFilteredTimeline(
      startDate,
      endDate,
    );
    const allTasks = await this.tasks.getTasks();

    // Create a map of task IDs to task objects
    const taskMap = {};
    allTasks.forEach((task) => {
      taskMap[task.id] = {
        name: task.name,
        tomatoCount: 0,
        totalMinutes: 0,
      };
    });

    // Add a category for "No Task" entries
    const noTaskStats = {
      name: "No Task",
      tomatoCount: 0,
      totalMinutes: 0,
    };

    let totalTomatoesInRange = 0;
    let totalMinutesInRange = 0;

    // Count tomatoes per task
    filteredTimeline.forEach((entry) => {
      if (entry.type === TIMER_TYPE.TOMATO) {
        const durationMin = (entry.duration || 0) / 60000;
        totalTomatoesInRange++;
        totalMinutesInRange += durationMin;

        if (entry.taskId && taskMap[entry.taskId]) {
          taskMap[entry.taskId].tomatoCount++;
          taskMap[entry.taskId].totalMinutes += durationMin;
        } else {
          noTaskStats.tomatoCount++;
          noTaskStats.totalMinutes += durationMin;
        }
      }
    });

    // Convert to array and sort by tomato count
    const taskStats = Object.values(taskMap).filter(
      (task) => task.tomatoCount > 0,
    );
    if (noTaskStats.tomatoCount > 0) {
      taskStats.push(noTaskStats);
    }
    taskStats.sort((a, b) => b.tomatoCount - a.tomatoCount);

    // Render task stats table
    this.renderTaskStats(taskStats, totalMinutesInRange);
  }

  renderTaskStats(taskStats, totalMinutesInRange) {
    if (!this.taskStatsBody) return;

    this.taskStatsBody.innerHTML = "";

    if (taskStats.length === 0) {
      this.taskStatsBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center" style="padding: 30px; color: #6c757d;">
            No task data available for the selected date range.
          </td>
        </tr>
      `;
      return;
    }

    taskStats.forEach((task) => {
      const row = document.createElement("tr");
      const percentage =
        totalMinutesInRange > 0
          ? ((task.totalMinutes / totalMinutesInRange) * 100).toFixed(1)
          : 0;

      row.innerHTML = `
        <td>${this.escapeHtml(task.name)}</td>
        <td><span class="badge badge-danger">${task.tomatoCount}</span></td>
        <td>${task.totalMinutes.toFixed(1)}</td>
        <td>${percentage}%</td>
      `;

      this.taskStatsBody.appendChild(row);
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async loadTimeOfDayStats(startDate, endDate) {
    const filteredTimeline = await this.timeline.getFilteredTimeline(
      startDate,
      endDate,
    );

    const timeOfDayStats = analyzeProductivityByTimeOfDay(filteredTimeline);
    const mostProductive = getMostProductiveTimeOfDay(timeOfDayStats);
    const formattedStats = formatTimeOfDayStats(timeOfDayStats);

    if (mostProductive && timeOfDayStats[mostProductive].count > 0) {
      this.mostProductiveTime.innerHTML = `
        <p>Your most productive time is:
          <span class="most-productive-badge">
            ${TIME_OF_DAY_LABELS[mostProductive]}
          </span>
        </p>
      `;
    } else {
      this.mostProductiveTime.innerHTML = `
        <p class="text-muted">Complete more tomatoes to see your most productive time of day!</p>
      `;
    }

    // Render time of day table
    this.renderTimeOfDayTable(formattedStats);

    // Render time of day chart
    this.renderTimeOfDayChart(formattedStats);
  }

  renderTimeOfDayTable(formattedStats) {
    if (!this.timeOfDayStatsBody) return;

    this.timeOfDayStatsBody.innerHTML = "";

    formattedStats.forEach((stat) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${TIME_OF_DAY_LABELS[stat.timeOfDay]}</td>
        <td>${stat.count}</td>
        <td>${stat.totalMinutes}</td>
        <td>${stat.avgMinutesPerSession}</td>
      `;
      this.timeOfDayStatsBody.appendChild(row);
    });
  }

  renderTimeOfDayChart(formattedStats) {
    // Destroy existing chart if it exists
    if (this.timeOfDayChart) {
      this.timeOfDayChart.destroy();
    }

    const labels = formattedStats.map(
      (stat) => TIME_OF_DAY_LABELS[stat.timeOfDay],
    );
    const data = formattedStats.map((stat) => stat.count);

    this.timeOfDayChart = new Chart(this.timeOfDayCtx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Tomatoes Completed",
            data: data,
            backgroundColor: [
              "rgba(255, 206, 86, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 99, 132, 0.6)",
              "rgba(75, 192, 192, 0.6)",
            ],
            borderColor: [
              "rgba(255, 206, 86, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 99, 132, 1)",
              "rgba(75, 192, 192, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: true,
            text: "Productivity by Time of Day",
          },
        },
      },
    });
  }

  async loadSessionHistory() {
    if (!this.sessionHistoryList) return;

    const limit = parseInt(this.sessionHistoryLimit?.value || "25");

    try {
      // Get all timeline entries
      const timeline = await this.timeline.getTimeline();

      // Filter only tomato sessions and sort by most recent
      const sessions = timeline
        .filter((entry) => entry.type === "tomato")
        .sort((a, b) => {
          const dateA = a.endTime ? new Date(a.endTime) : new Date(0);
          const dateB = b.endTime ? new Date(b.endTime) : new Date(0);
          return dateB - dateA;
        })
        .slice(0, limit);

      // Get all tasks for reference
      const allTasks = await this.tasks.getTasks();
      const taskMap = {};
      allTasks.forEach((task) => {
        taskMap[task.id] = task.name;
      });

      // Render session cards
      this.renderSessionHistory(sessions, taskMap);
    } catch (error) {
      console.error("Error loading session history:", error);
      this.sessionHistoryList.innerHTML = `
        <p class="text-muted">Error loading session history.</p>
      `;
    }
  }

  renderSessionHistory(sessions, taskMap) {
    if (!this.sessionHistoryList) return;

    // Check if there are any sessions with notes
    const sessionsWithNotes = sessions.filter((s) => s.note && s.note.trim());

    if (sessions.length === 0) {
      this.sessionHistoryList.innerHTML = `
        <div class="no-notes-message">
          <p>No tomato sessions found yet.</p>
          <p>Complete a tomato session to start building your history!</p>
        </div>
      `;
      return;
    }

    if (sessionsWithNotes.length === 0) {
      this.sessionHistoryList.innerHTML = `
        <div class="no-notes-message">
          <p>No session notes found yet.</p>
          <p>After completing a tomato session, add notes about what you accomplished!</p>
        </div>
      `;
      return;
    }

    // Build HTML for session cards
    const cardsHTML = sessions
      .map((session) => {
        const endTime = session.endTime ? new Date(session.endTime) : null;
        const dateStr = endTime
          ? endTime.toLocaleString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Unknown date";

        const durationMin = session.duration
          ? Math.round(session.duration / 60000)
          : 0;

        const taskName = session.taskId
          ? taskMap[session.taskId] || "Unknown Task"
          : null;

        const hasNote = session.note && session.note.trim();

        // Only show sessions with notes
        if (!hasNote) return "";

        return `
          <div class="session-card">
            <div class="session-card-header">
              <span class="session-type-badge session-type-${session.type}">
                🍅 Tomato (${durationMin}m)
              </span>
              <span class="session-date">${this.escapeHtml(dateStr)}</span>
            </div>
            <div class="session-card-body">
              ${
                taskName
                  ? `<div class="session-task-info">
                    Task: <span class="session-task-name">${this.escapeHtml(taskName)}</span>
                  </div>`
                  : ""
              }
              <div class="session-note-content">
                ${this.escapeHtml(session.note)}
              </div>
            </div>
          </div>
        `;
      })
      .filter((html) => html) // Remove empty strings
      .join("");

    this.sessionHistoryList.innerHTML =
      cardsHTML ||
      `
      <div class="no-notes-message">
        <p>No session notes in the selected range.</p>
      </div>
    `;
  }
}

function mapTomatoStatsToCalendarEvents(timelineArr) {
  return timelineArr
    .filter(
      (entry) =>
        entry.type === TIMER_TYPE.TOMATO && (entry.endTime || entry.date),
    )
    .map((entry) => {
      const eventDate = entry.endTime
        ? new Date(entry.endTime).toISOString().split("T")[0]
        : new Date(entry.date).toISOString().split("T")[0];
      const durationMin = (entry.duration || 0) / 60000;
      return {
        title: `🍅 ${durationMin.toFixed(0)} min`,
        start: eventDate,
        allDay: true,
        backgroundColor: "#ff6347",
      };
    });
}

function renderStatsCalendar(timelineArr) {
  const calendarEl = document.getElementById("stats-calendar");
  if (!calendarEl) return;
  calendarEl.innerHTML = "";
  const calendar = new Calendar(calendarEl, {
    plugins: [dayGridPlugin],
    initialView: "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth",
    },
    events: mapTomatoStatsToCalendarEvents(timelineArr),
    height: 500,
    eventDisplay: "block",
  });
  calendar.render();
}

$(document).ready(() => {
  Chart.defaults.responsive = true;
  const stats = new Stats();

  // Date Picker
  const momentLastWeek = moment().subtract(6, "days");
  const momentToday = moment();

  $('input[name="daterange"]').daterangepicker(
    {
      locale: {
        format: "dddd, MMMM Do YYYY",
      },
      dateLimit: {
        months: 1,
      },
      startDate: momentLastWeek,
      endDate: momentToday,
      ranges: {
        "Last 7 Days": [moment().subtract(6, "days"), moment()],
        "This week": [moment().startOf("week"), moment().endOf("week")],
        "Last week": [
          moment().subtract(1, "week").startOf("week"),
          moment().subtract(1, "week").endOf("week"),
        ],
        "Last 30 Days": [moment().subtract(29, "days"), moment()],
        "This Month": [moment().startOf("month"), moment().endOf("month")],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
        "This Year": [moment().startOf("year"), moment().endOf("year")],
        "Last Year": [
          moment().subtract(1, "year").startOf("year"),
          moment().subtract(1, "year").endOf("year"),
        ],
      },
    },
    (momentStartDate, momentEndDate, label) => {
      // Convert Moment dates to native JS dates
      const startDate = momentStartDate.toDate();
      const endDate = momentEndDate.toDate();

      const isRangeYear = label === "This Year" || label === "Last Year";
      const dateUnit = isRangeYear ? DATE_UNIT.MONTH : DATE_UNIT.DAY;

      stats.changeStatDates(startDate, endDate, dateUnit);
    },
  );
});
