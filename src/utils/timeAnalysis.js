import { TIME_OF_DAY } from "./constants";

/**
 * Get the time of day category for a given date
 * @param {Date} date - The date to categorize
 * @returns {string} - TIME_OF_DAY constant
 */
export function getTimeOfDay(date) {
  const hours = date.getHours();

  if (hours >= 6 && hours < 12) {
    return TIME_OF_DAY.MORNING;
  } else if (hours >= 12 && hours < 18) {
    return TIME_OF_DAY.AFTERNOON;
  } else if (hours >= 18 && hours < 22) {
    return TIME_OF_DAY.EVENING;
  } else {
    return TIME_OF_DAY.NIGHT;
  }
}

/**
 * Analyze productivity by time of day
 * @param {Array} timeline - Array of timeline entries
 * @returns {Object} - Stats grouped by time of day
 */
export function analyzeProductivityByTimeOfDay(timeline) {
  const stats = {
    [TIME_OF_DAY.MORNING]: { count: 0, totalMinutes: 0 },
    [TIME_OF_DAY.AFTERNOON]: { count: 0, totalMinutes: 0 },
    [TIME_OF_DAY.EVENING]: { count: 0, totalMinutes: 0 },
    [TIME_OF_DAY.NIGHT]: { count: 0, totalMinutes: 0 },
  };

  const tomatoSessions = timeline.filter((entry) => entry.type === "tomato");

  tomatoSessions.forEach((entry) => {
    const endTime = entry.endTime ? new Date(entry.endTime) : null;
    if (!endTime) return;

    const timeOfDay = getTimeOfDay(endTime);
    const durationMinutes = entry.duration / 60000;

    stats[timeOfDay].count += 1;
    stats[timeOfDay].totalMinutes += durationMinutes;
  });

  return stats;
}

/**
 * Get the most productive time of day
 * @param {Object} stats - Stats object from analyzeProductivityByTimeOfDay
 * @returns {string|null} - Most productive time of day or null if no data
 */
export function getMostProductiveTimeOfDay(stats) {
  let maxCount = 0;
  let mostProductive = null;

  Object.keys(stats).forEach((timeOfDay) => {
    if (stats[timeOfDay].count > maxCount) {
      maxCount = stats[timeOfDay].count;
      mostProductive = timeOfDay;
    }
  });

  return mostProductive;
}

/**
 * Format time of day stats for display
 * @param {Object} stats - Stats object from analyzeProductivityByTimeOfDay
 * @returns {Array} - Formatted array of stats
 */
export function formatTimeOfDayStats(stats) {
  return Object.keys(stats).map((timeOfDay) => ({
    timeOfDay,
    count: stats[timeOfDay].count,
    totalMinutes: Math.round(stats[timeOfDay].totalMinutes),
    avgMinutesPerSession:
      stats[timeOfDay].count > 0
        ? Math.round(stats[timeOfDay].totalMinutes / stats[timeOfDay].count)
        : 0,
  }));
}
