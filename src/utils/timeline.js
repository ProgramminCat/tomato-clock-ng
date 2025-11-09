import browser from "webextension-polyfill";
import isEqual from "lodash/isEqual";

import { STORAGE_KEY } from "./constants";
import { getMergedAndDedupedArray } from "./utils";

export default class Timeline {
  constructor(notifications) {
    // Keep storage size limits in mind
    this.storage = browser.storage.local;
    this.notifications = notifications;
  }

  async _getLocalTimeline() {
    const localStorageResults = await browser.storage.local.get(
      STORAGE_KEY.TIMELINE,
    );
    return localStorageResults[STORAGE_KEY.TIMELINE];
  }

  async _getSyncTimeline() {
    const syncStorageResults = await browser.storage.sync.get(
      STORAGE_KEY.TIMELINE,
    );
    return syncStorageResults[STORAGE_KEY.TIMELINE];
  }

  async _setLocalTimeline(timeline) {
    await browser.storage.local.set({ [STORAGE_KEY.TIMELINE]: timeline });
  }

  async _setSyncTimeline(timeline) {
    await browser.storage.sync.set({ [STORAGE_KEY.TIMELINE]: timeline });
  }

  async _removeSyncTimelineIfLocalIsExpected(expectedTimeline) {
    const localTimeline = await this._getLocalTimeline();

    if (isEqual(localTimeline, expectedTimeline)) {
      await browser.storage.sync.remove(STORAGE_KEY.TIMELINE);
    } else {
      throw "localTimeline is not equal to expectedTimeline";
    }
  }

  async switchStorageFromSyncToLocal() {
    const syncTimeline = await this._getSyncTimeline();
    const localTimeline = await this._getLocalTimeline();

    if (syncTimeline && !localTimeline) {
      await this._setLocalTimeline(syncTimeline);
      await this._removeSyncTimelineIfLocalIsExpected(syncTimeline);
    } else if (syncTimeline && localTimeline) {
      const mergedAndDedupedTimeline = getMergedAndDedupedArray(
        syncTimeline,
        localTimeline,
      );
      await this._setLocalTimeline(mergedAndDedupedTimeline);
      await this._removeSyncTimelineIfLocalIsExpected(mergedAndDedupedTimeline);
    }
  }

  async _getRawTimeline() {
    const localTimeline = await this._getLocalTimeline();
    const syncTimeline = await this._getSyncTimeline();

    // Prefer local storage
    // Check sync storage for backwards compatibility
    return localTimeline || syncTimeline || [];
  }

  async getTimeline() {
    const timeline = await this._getRawTimeline();

    return timeline.map((item) => {
      if (item.startTime) item.startTime = new Date(item.startTime);
      if (item.endTime) item.endTime = new Date(item.endTime);
      return item;
    });
  }

  async setTimeline(newTimeline) {
    const timeline = await this._getRawTimeline();
    newTimeline.map((item) => {
      timeline.push(item);
    });

    try {
      await this.storage.set({ [STORAGE_KEY.TIMELINE]: timeline });
    } catch (e) {
      if (e.message.startsWith("QuotaExceededError")) {
        await this.notifications.createStorageLimitNotification();
      }
    }
  }

  async getFilteredTimeline(startDate, endDate) {
    const timeline = await this.getTimeline();
    return timeline.filter((entry) => {
      const eventTime = entry.endTime
        ? new Date(entry.endTime)
        : entry.date
          ? new Date(entry.date)
          : null;
      return eventTime && eventTime >= startDate && eventTime <= endDate;
    });
  }

  async addAlarmToTimeline(type, totalTime, taskId = null) {
    const timeline = await this._getRawTimeline();

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + totalTime);
    const duration = totalTime; // in ms

    const entry = {
      type,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
    };

    if (taskId) {
      entry.taskId = taskId;
    }

    timeline.push(entry);

    try {
      await this.storage.set({ [STORAGE_KEY.TIMELINE]: timeline });
    } catch (e) {
      if (e.message && e.message.startsWith("QuotaExceededError")) {
        await this.notifications.createStorageLimitNotification();
      }
    }
  }

  async resetTimeline() {
    await browser.storage.sync.remove(STORAGE_KEY.TIMELINE);
    await browser.storage.local.remove(STORAGE_KEY.TIMELINE);
  }
}
