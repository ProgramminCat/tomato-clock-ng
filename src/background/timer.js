import browser from "webextension-polyfill";

import Settings from "../utils/settings";
import Badge from "./badge";
import Notifications from "./notifications";
import Timeline from "../utils/timeline";
import Tasks from "../utils/tasks";
import Gamification from "../utils/gamification";
import {
  getMillisecondsToMinutesAndSeconds,
  getSecondsInMilliseconds,
  getTimerTypeMilliseconds,
} from "../utils/utils";
import {
  RUNTIME_ACTION,
  TIMER_TYPE,
  BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE,
} from "../utils/constants";

export default class Timer {
  constructor() {
    this.settings = new Settings();
    this.badge = new Badge();
    this.notifications = new Notifications(this.settings);
    this.timeline = new Timeline();
    this.tasks = new Tasks();
    this.gamification = new Gamification();

    this.timeline.switchStorageFromSyncToLocal();

    this.timer = {};

    this.resetTimer();
    this.setListeners();
  }

  getTimer() {
    return this.timer;
  }

  resetTimer() {
    if (this.timer.interval) {
      clearInterval(this.timer.interval);
    }

    this.timer = {
      interval: null,
      scheduledTime: null,
      totalTime: 0,
      type: null,
      taskId: null,
      startTime: null,
    };

    this.badge.setBadgeText("");
  }

  setTimer(type, taskId = null) {
    this.resetTimer();
    const badgeBackgroundColor = BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE[type];

    this.settings.getSettings().then((settings) => {
      const milliseconds = getTimerTypeMilliseconds(type, settings);

      this.timer = {
        interval: setInterval(() => {
          const timer = this.getTimer();
          const timeLeft = timer.scheduledTime - Date.now();

          if (timeLeft <= 0) {
            const sessionData = {
              type: timer.type,
              totalTime: timer.totalTime,
              taskId: timer.taskId,
              startTime: timer.startTime,
            };

            
            const durationMinutes = timer.totalTime / 60000;
            this.gamification
              .recordSessionCompletion(timer.type, durationMinutes)
              .then((result) => {
                sessionData.gamificationData = result;

                this.notifications.createBrowserNotification(
                  timer.type,
                  sessionData,
                );

                browser.runtime.sendMessage({
                  type: "gamification-update",
                  data: result,
                });

                browser.runtime.sendMessage({
                  type: "timer-finished",
                  sessionData: sessionData,
                });
              })
              .catch((error) => {
                console.error("Error recording gamification:", error);
                this.notifications.createBrowserNotification(
                  timer.type,
                  sessionData,
                );
                browser.runtime.sendMessage({
                  type: "timer-finished",
                  sessionData: sessionData,
                });
              });

            this.timeline.addAlarmToTimeline(
              timer.type,
              timer.totalTime,
              timer.taskId,
            );

            // Increment task stats if this is a tomato with a task
            if (timer.type === TIMER_TYPE.TOMATO && timer.taskId) {
              const durationMinutes = timer.totalTime / 60000;
              this.tasks.incrementTaskStats(timer.taskId, durationMinutes);
            }

            this.resetTimer();
          } else {
            const minutesLeft =
              getMillisecondsToMinutesAndSeconds(timeLeft).minutes.toString();
            const secondsLeft =
              getMillisecondsToMinutesAndSeconds(timeLeft).seconds;

            if (this.badge.getBadgeText() !== minutesLeft) {
              if (minutesLeft === "0" && secondsLeft < 60)
                this.badge.setBadgeText("<1", badgeBackgroundColor);
              else this.badge.setBadgeText(minutesLeft, badgeBackgroundColor);
            }
          }
        }, getSecondsInMilliseconds(1)),
        scheduledTime: Date.now() + milliseconds,
        totalTime: milliseconds,
        type,
        taskId,
        startTime: Date.now(),
      };

      const { minutes } = getMillisecondsToMinutesAndSeconds(milliseconds);
      this.badge.setBadgeText(minutes.toString(), badgeBackgroundColor);
    });
  }

  getTimerScheduledTime() {
    return this.timer.scheduledTime;
  }

  setListeners() {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case RUNTIME_ACTION.RESET_TIMER:
          this.resetTimer();
          break;
        case RUNTIME_ACTION.SET_TIMER:
          this.setTimer(request.data.type, request.data.taskId);
          break;
        case RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME:
          // Hack because of difference in chrome and firefox
          // Check if polyfill fixes the issue
          if (sendResponse) {
            sendResponse(this.getTimerScheduledTime());
          }
          return this.getTimerScheduledTime();
        case RUNTIME_ACTION.GET_GAMIFICATION_DATA:
          this.gamification.getData().then((data) => {
            if (sendResponse) {
              sendResponse(data);
            }
          });
          return true;
        case RUNTIME_ACTION.GET_LEVEL_PROGRESS:
          this.gamification.getData().then((data) => {
            const progress = this.gamification.getProgressToNextLevel(
              data.xp,
              data.level,
            );
            if (sendResponse) {
              sendResponse(progress);
            }
          });
          return true;
        default:
          break;
      }
    });

    browser.commands.onCommand.addListener((command) => {
      switch (command) {
        case "start-tomato":
          this.setTimer(TIMER_TYPE.TOMATO, null);
          break;
        case "start-short-break":
          this.setTimer(TIMER_TYPE.SHORT_BREAK, null);
          break;
        case "start-long-break":
          this.setTimer(TIMER_TYPE.LONG_BREAK, null);
          break;
        case "reset-timer":
          this.resetTimer();
          break;
        default:
          break;
      }
    });
  }
}
