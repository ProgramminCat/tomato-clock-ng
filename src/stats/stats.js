import $ from "jquery";
import { Chart, registerables } from 'chart.js';
import moment from "moment";
import "daterangepicker";

import "bootstrap/dist/css/bootstrap.min.css";
import "daterangepicker/daterangepicker.css";
import "./stats.css";

import Timeline from "../utils/timeline";
import {
  getDateLabel,
  getDateRangeStringArray,
  getZeroArray,
  getFilenameDate,
} from "../utils/utils";
import { DATE_UNIT, TIMER_TYPE } from "../utils/constants";

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
      "import-stats-hidden-input"
    );

    this.ctx = document
      .getElementById("completed-tomato-dates-chart")
      .getContext("2d");
    this.completedTomatoesChart = null;

    this.handleResetStatsButtonClick = this.handleResetStatsButtonClick.bind(
      this
    );
    this.handleExportStatsButtonClick = this.handleExportStatsButtonClick.bind(
      this
    );
    this.handleImportStatsButtonClick = this.handleImportStatsButtonClick.bind(
      this
    );
    this.handleImportStatsHiddenInputChange = this.handleImportStatsHiddenInputChange.bind(
      this
    );
    this.resetStatsButton.addEventListener(
      "click",
      this.handleResetStatsButtonClick
    );
    this.exportStatsButton.addEventListener(
      "click",
      this.handleExportStatsButtonClick
    );
    this.importStatsHiddenInput.addEventListener(
      "change",
      this.handleImportStatsHiddenInputChange
    );

    this.timeline = new Timeline();
    this.resetDateRange();

    this.importLegacyStatsButton = document.getElementById("import-legacy-stats-button");

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
      this.handleImportStatsHiddenInputChange.bind(this)
    );
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
      let exportVersion = "6.0.3"; // TODO: make version var here not hardcoded
      let specificationUrl = "https://github.com/ProgramminCat/tomato-clock-ng/?tab=readme-ov-file#statistics-json-format";

      // detect if legacy format and convert to new format
      if (Array.isArray(timeline) && timeline.length > 0 && "date" in timeline[0]) {
        processedData = timeline.map((item) => {
          const startTime = new Date(item.date).toISOString();
          const endTime = new Date(new Date(item.date).getTime() + item.timeout).toISOString();
          return {
            type: item.type,
            startTime: startTime,
            endTime: endTime,
            duration: item.timeout
          };
        });
      }

      const exportObject = {
        specificationUrl: specificationUrl,
        version: exportVersion,
        exportedAt: new Date().toISOString(),
        data: processedData
      };

      const filename = `${getFilenameDate()}_tomato-clock-ng-stats.json`;
      const dataStr = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const dlAnchorElem = document.getElementById("downloadAnchorElem") || document.createElement("a");
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
    if (!timelineArr.every(entry => entry && entry.type && (entry.date || entry.startTime || entry.endTime))) {
      alert("The imported data does not appear to be valid Tomato Clock stats.");
      e.target.value = "";
      return;
    }

    // Save to browser.storage.local
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      await browser.storage.local.set({ timeline: timelineArr });
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
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
  }

  async changeStatDates(startDate, endDate, dateUnit) {
    const filteredTimeline = await this.timeline.getFilteredTimeline(
      startDate,
      endDate
    );
    const dateRangeStrings = getDateRangeStringArray(
      startDate,
      endDate,
      dateUnit
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
    };

    // Go through timeline
    for (let timelineAlarm of filteredTimeline) {
      switch (timelineAlarm.type) {
        case TIMER_TYPE.TOMATO:
          stats.tomatoes++;
          const eventDate = timelineAlarm.endTime
            ? new Date(timelineAlarm.endTime)
            : (timelineAlarm.date ? new Date(timelineAlarm.date) : null);

          if (eventDate) {
            this.addTomatoDateToChartData(
              completedTomatoesChartData,
              eventDate,
              dateUnit
            );
          }
          break;
        case TIMER_TYPE.SHORT_BREAK:
          stats.shortBreaks++;
          break;
        case TIMER_TYPE.LONG_BREAK:
          stats.longBreaks++;
          break;
        default:
          break;
      }
    }

    this.setStatsText(stats);

    // Setup 'Completed Tomatoes' Line Chart
    if (this.completedTomatoesChart) {
      this.completedTomatoesChart.config.data = completedTomatoesChartData;
      this.completedTomatoesChart.update();
    } else {
      this.completedTomatoesChart = new Chart(this.ctx, {
        type: "line",
        data: completedTomatoesChartData,
        options: {
          tooltips: {
            intersect: false,
            mode: "nearest",
          },
          scales: {
            y: {
              type: 'linear',
              ticks: {
                maxTicksLimit: 5,
                suggestedMax: 5,
                beginAtZero: true
              }
            }
          },
          legend: {
            position: "bottom",
          },
        },
      });
    }
  }
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
    }
  );
});
