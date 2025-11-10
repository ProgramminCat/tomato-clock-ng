import browser from "webextension-polyfill";
import { STORAGE_KEY, TIMER_TYPE } from "./constants";

const GAMIFICATION_STORAGE_KEY = "gamification";

// Badge definitions
export const BADGES = {
  // Completion badges
  FIRST_TOMATO: {
    id: "first_tomato",
    name: "First Steps",
    description: "Complete your first tomato session",
    icon: "🍅",
    tier: "bronze",
    requirement: { type: "tomatoes_completed", count: 1 },
  },
  TOMATO_10: {
    id: "tomato_10",
    name: "Getting Started",
    description: "Complete 10 tomato sessions",
    icon: "🎯",
    tier: "bronze",
    requirement: { type: "tomatoes_completed", count: 10 },
  },
  TOMATO_50: {
    id: "tomato_50",
    name: "Dedicated Worker",
    description: "Complete 50 tomato sessions",
    icon: "💪",
    tier: "silver",
    requirement: { type: "tomatoes_completed", count: 50 },
  },
  TOMATO_100: {
    id: "tomato_100",
    name: "Century Club",
    description: "Complete 100 tomato sessions",
    icon: "💯",
    tier: "gold",
    requirement: { type: "tomatoes_completed", count: 100 },
  },
  TOMATO_250: {
    id: "tomato_250",
    name: "Productivity Master",
    description: "Complete 250 tomato sessions",
    icon: "👑",
    tier: "platinum",
    requirement: { type: "tomatoes_completed", count: 250 },
  },
  TOMATO_500: {
    id: "tomato_500",
    name: "Legendary Focus",
    description: "Complete 500 tomato sessions",
    icon: "🏆",
    tier: "diamond",
    requirement: { type: "tomatoes_completed", count: 500 },
  },

  // Streak badges
  STREAK_3: {
    id: "streak_3",
    name: "Building Momentum",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    tier: "bronze",
    requirement: { type: "streak", count: 3 },
  },
  STREAK_7: {
    id: "streak_7",
    name: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "⚡",
    tier: "silver",
    requirement: { type: "streak", count: 7 },
  },
  STREAK_30: {
    id: "streak_30",
    name: "Monthly Mastery",
    description: "Maintain a 30-day streak",
    icon: "🌟",
    tier: "gold",
    requirement: { type: "streak", count: 30 },
  },
  STREAK_100: {
    id: "streak_100",
    name: "Unstoppable Force",
    description: "Maintain a 100-day streak",
    icon: "💫",
    tier: "diamond",
    requirement: { type: "streak", count: 100 },
  },

  // Time-based badges
  HOURS_10: {
    id: "hours_10",
    name: "Time Investment",
    description: "Log 10 hours of focus time",
    icon: "⏰",
    tier: "bronze",
    requirement: { type: "total_minutes", count: 600 },
  },
  HOURS_50: {
    id: "hours_50",
    name: "Focused Mind",
    description: "Log 50 hours of focus time",
    icon: "🧠",
    tier: "silver",
    requirement: { type: "total_minutes", count: 3000 },
  },
  HOURS_100: {
    id: "hours_100",
    name: "Time Master",
    description: "Log 100 hours of focus time",
    icon: "⌛",
    tier: "gold",
    requirement: { type: "total_minutes", count: 6000 },
  },
  HOURS_500: {
    id: "hours_500",
    name: "Marathon Runner",
    description: "Log 500 hours of focus time",
    icon: "🎖️",
    tier: "platinum",
    requirement: { type: "total_minutes", count: 30000 },
  },

  // Daily achievement badges
  EARLY_BIRD: {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete 10 morning sessions (6am-9am)",
    icon: "🌅",
    tier: "silver",
    requirement: { type: "morning_sessions", count: 10 },
  },
  NIGHT_OWL: {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete 10 late night sessions (10pm-2am)",
    icon: "🦉",
    tier: "silver",
    requirement: { type: "night_sessions", count: 10 },
  },

  // Productivity badges
  PRODUCTIVE_DAY: {
    id: "productive_day",
    name: "Super Productive",
    description: "Complete 10 tomatoes in a single day",
    icon: "🚀",
    tier: "gold",
    requirement: { type: "tomatoes_in_day", count: 10 },
  },
  MARATHON_DAY: {
    id: "marathon_day",
    name: "Marathon Day",
    description: "Complete 15 tomatoes in a single day",
    icon: "🏅",
    tier: "platinum",
    requirement: { type: "tomatoes_in_day", count: 15 },
  },

  // Perfect week badges
  PERFECT_WEEK: {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete at least 5 tomatoes every day for 7 days",
    icon: "✨",
    tier: "platinum",
    requirement: { type: "perfect_week", count: 1 },
  },

  // Consistency badges
  CONSISTENT_WORKER: {
    id: "consistent_worker",
    name: "Consistent Worker",
    description: "Work at least 20 days in a month",
    icon: "📅",
    tier: "gold",
    requirement: { type: "days_worked_in_month", count: 20 },
  },
};

// Level system
export const LEVELS = [
  { level: 1, name: "Beginner", xpRequired: 0, icon: "🌱" },
  { level: 2, name: "Learner", xpRequired: 100, icon: "🌿" },
  { level: 3, name: "Apprentice", xpRequired: 250, icon: "🍃" },
  { level: 4, name: "Practitioner", xpRequired: 500, icon: "🌳" },
  { level: 5, name: "Professional", xpRequired: 1000, icon: "🎯" },
  { level: 6, name: "Expert", xpRequired: 2000, icon: "⭐" },
  { level: 7, name: "Master", xpRequired: 4000, icon: "💎" },
  { level: 8, name: "Grandmaster", xpRequired: 8000, icon: "👑" },
  { level: 9, name: "Legend", xpRequired: 15000, icon: "🏆" },
  { level: 10, name: "Mythic", xpRequired: 25000, icon: "🌟" },
];

// XP values
const XP_VALUES = {
  TOMATO_COMPLETED: 10,
  SHORT_BREAK_COMPLETED: 2,
  LONG_BREAK_COMPLETED: 5,
  STREAK_BONUS_PER_DAY: 5,
  BADGE_EARNED_BONUS: {
    bronze: 25,
    silver: 50,
    gold: 100,
    platinum: 200,
    diamond: 500,
  },
};

export default class Gamification {
  constructor() {
    this.data = null;
  }

  async _getGamificationData() {
    const result = await browser.storage.local.get(GAMIFICATION_STORAGE_KEY);
    return (
      result[GAMIFICATION_STORAGE_KEY] || {
        xp: 0,
        level: 1,
        earnedBadges: [],
        stats: {
          tomatoesCompleted: 0,
          shortBreaksCompleted: 0,
          longBreaksCompleted: 0,
          totalMinutes: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletionDate: null,
          dailyStats: {}, // { "2024-01-01": { tomatoes: 5, minutes: 125 } }
          morningSessionsCount: 0,
          nightSessionsCount: 0,
          perfectWeeksCount: 0,
        },
        achievements: [],
        recentlyEarnedBadges: [], // For showing notifications
      }
    );
  }

  async _saveGamificationData(data) {
    await browser.storage.local.set({ [GAMIFICATION_STORAGE_KEY]: data });
    this.data = data;
  }

  async getData() {
    if (!this.data) {
      this.data = await this._getGamificationData();
    }
    return this.data;
  }

  async addXP(amount, reason = "") {
    const data = await this.getData();
    data.xp += amount;

    // Check for level up
    const newLevel = this._calculateLevel(data.xp);
    const leveledUp = newLevel > data.level;
    const oldLevel = data.level;
    data.level = newLevel;

    await this._saveGamificationData(data);

    return {
      xp: data.xp,
      level: data.level,
      leveledUp,
      oldLevel,
      amount,
      reason,
    };
  }

  _calculateLevel(xp) {
    let level = 1;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xpRequired) {
        level = LEVELS[i].level;
        break;
      }
    }
    return level;
  }

  getLevelInfo(level) {
    return LEVELS.find((l) => l.level === level) || LEVELS[0];
  }

  getNextLevelInfo(currentLevel) {
    return LEVELS.find((l) => l.level === currentLevel + 1) || null;
  }

  getProgressToNextLevel(currentXP, currentLevel) {
    const currentLevelInfo = this.getLevelInfo(currentLevel);
    const nextLevelInfo = this.getNextLevelInfo(currentLevel);

    if (!nextLevelInfo) {
      return { percentage: 100, xpNeeded: 0, xpCurrent: currentXP };
    }

    const xpForCurrentLevel = currentLevelInfo.xpRequired;
    const xpForNextLevel = nextLevelInfo.xpRequired;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const xpProgress = currentXP - xpForCurrentLevel;
    const percentage = Math.min((xpProgress / xpNeeded) * 100, 100);

    return {
      percentage: Math.round(percentage),
      xpNeeded,
      xpCurrent: xpProgress,
      xpTotal: xpForNextLevel,
    };
  }

  async recordSessionCompletion(type, durationMinutes) {
    const data = await this.getData();
    const today = new Date().toISOString().split("T")[0];
    const hour = new Date().getHours();

    let xpEarned = 0;
    const xpBreakdown = [];

    // Update stats based on timer type
    if (type === TIMER_TYPE.TOMATO) {
      data.stats.tomatoesCompleted++;
      data.stats.totalMinutes += durationMinutes;
      xpEarned += XP_VALUES.TOMATO_COMPLETED;
      xpBreakdown.push({ reason: "Tomato completed", amount: XP_VALUES.TOMATO_COMPLETED });

      // Track morning/night sessions
      if (hour >= 6 && hour < 9) {
        data.stats.morningSessionsCount++;
      } else if (hour >= 22 || hour < 2) {
        data.stats.nightSessionsCount++;
      }

      // Update daily stats
      if (!data.stats.dailyStats[today]) {
        data.stats.dailyStats[today] = { tomatoes: 0, minutes: 0 };
      }
      data.stats.dailyStats[today].tomatoes++;
      data.stats.dailyStats[today].minutes += durationMinutes;

      // Update streak
      this._updateStreak(data, today);

      // Streak bonus XP
      if (data.stats.currentStreak > 0) {
        const streakBonus = Math.min(
          data.stats.currentStreak * XP_VALUES.STREAK_BONUS_PER_DAY,
          100
        );
        xpEarned += streakBonus;
        xpBreakdown.push({
          reason: `${data.stats.currentStreak} day streak bonus`,
          amount: streakBonus,
        });
      }
    } else if (type === TIMER_TYPE.SHORT_BREAK) {
      data.stats.shortBreaksCompleted++;
      xpEarned += XP_VALUES.SHORT_BREAK_COMPLETED;
      xpBreakdown.push({ reason: "Short break completed", amount: XP_VALUES.SHORT_BREAK_COMPLETED });
    } else if (type === TIMER_TYPE.LONG_BREAK) {
      data.stats.longBreaksCompleted++;
      xpEarned += XP_VALUES.LONG_BREAK_COMPLETED;
      xpBreakdown.push({ reason: "Long break completed", amount: XP_VALUES.LONG_BREAK_COMPLETED });
    }

    await this._saveGamificationData(data);

    // Add XP
    const xpResult = await this.addXP(xpEarned, `Session completed`);

    // Check for new badges
    const newBadges = await this.checkAndAwardBadges();

    return {
      xpResult,
      newBadges,
      xpBreakdown,
      currentStreak: data.stats.currentStreak,
    };
  }

  _updateStreak(data, today) {
    const lastDate = data.stats.lastCompletionDate;

    if (!lastDate) {
      // First ever completion
      data.stats.currentStreak = 1;
      data.stats.longestStreak = 1;
    } else if (lastDate === today) {
      // Already completed today, don't change streak
      return;
    } else {
      const lastDateTime = new Date(lastDate);
      const todayTime = new Date(today);
      const diffDays = Math.floor(
        (todayTime - lastDateTime) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        // Consecutive day
        data.stats.currentStreak++;
        if (data.stats.currentStreak > data.stats.longestStreak) {
          data.stats.longestStreak = data.stats.currentStreak;
        }
      } else if (diffDays > 1) {
        // Streak broken
        data.stats.currentStreak = 1;
      }
    }

    data.stats.lastCompletionDate = today;
  }

  async checkAndAwardBadges() {
    const data = await this.getData();
    const newBadges = [];

    for (const [key, badge] of Object.entries(BADGES)) {
      // Skip if already earned
      if (data.earnedBadges.includes(badge.id)) {
        continue;
      }

      // Check if requirements are met
      if (this._checkBadgeRequirement(badge, data)) {
        data.earnedBadges.push(badge.id);
        data.recentlyEarnedBadges.push({
          ...badge,
          earnedAt: new Date().toISOString(),
        });
        newBadges.push(badge);

        // Award bonus XP for earning badge
        const bonusXP = XP_VALUES.BADGE_EARNED_BONUS[badge.tier] || 10;
        await this.addXP(bonusXP, `Earned badge: ${badge.name}`);
      }
    }

    if (newBadges.length > 0) {
      await this._saveGamificationData(data);
    }

    return newBadges;
  }

  _checkBadgeRequirement(badge, data) {
    const req = badge.requirement;
    const stats = data.stats;

    switch (req.type) {
      case "tomatoes_completed":
        return stats.tomatoesCompleted >= req.count;

      case "streak":
        return stats.longestStreak >= req.count;

      case "total_minutes":
        return stats.totalMinutes >= req.count;

      case "morning_sessions":
        return stats.morningSessionsCount >= req.count;

      case "night_sessions":
        return stats.nightSessionsCount >= req.count;

      case "tomatoes_in_day":
        return this._checkMaxTomatoesInDay(stats) >= req.count;

      case "perfect_week":
        return this._checkPerfectWeeks(stats) >= req.count;

      case "days_worked_in_month":
        return this._checkDaysWorkedInMonth(stats) >= req.count;

      default:
        return false;
    }
  }

  _checkMaxTomatoesInDay(stats) {
    let max = 0;
    for (const [date, dayStats] of Object.entries(stats.dailyStats)) {
      if (dayStats.tomatoes > max) {
        max = dayStats.tomatoes;
      }
    }
    return max;
  }

  _checkPerfectWeeks(stats) {
    const dailyStats = stats.dailyStats;
    const dates = Object.keys(dailyStats).sort();

    if (dates.length < 7) return 0;

    let perfectWeeks = 0;
    let consecutiveDays = 0;
    let allDaysHave5Plus = true;

    for (let i = 0; i < dates.length; i++) {
      const tomatoes = dailyStats[dates[i]].tomatoes;

      if (tomatoes >= 5) {
        if (i > 0) {
          const prevDate = new Date(dates[i - 1]);
          const currDate = new Date(dates[i]);
          const diffDays = Math.floor(
            (currDate - prevDate) / (1000 * 60 * 60 * 24)
          );

          if (diffDays === 1) {
            consecutiveDays++;
          } else {
            consecutiveDays = 1;
            allDaysHave5Plus = true;
          }
        } else {
          consecutiveDays = 1;
        }

        if (consecutiveDays >= 7) {
          perfectWeeks++;
          consecutiveDays = 0;
        }
      } else {
        consecutiveDays = 0;
        allDaysHave5Plus = false;
      }
    }

    return perfectWeeks;
  }

  _checkDaysWorkedInMonth(stats) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let daysWorked = 0;

    for (const [date, dayStats] of Object.entries(stats.dailyStats)) {
      const d = new Date(date);
      if (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        dayStats.tomatoes > 0
      ) {
        daysWorked++;
      }
    }

    return daysWorked;
  }

  async getEarnedBadges() {
    const data = await this.getData();
    return data.earnedBadges.map((badgeId) => {
      return Object.values(BADGES).find((b) => b.id === badgeId);
    });
  }

  async getRecentBadges(limit = 5) {
    const data = await this.getData();
    return data.recentlyEarnedBadges.slice(-limit).reverse();
  }

  async clearRecentBadges() {
    const data = await this.getData();
    data.recentlyEarnedBadges = [];
    await this._saveGamificationData(data);
  }

  async getAllBadgesWithStatus() {
    const data = await this.getData();
    return Object.values(BADGES).map((badge) => {
      const earned = data.earnedBadges.includes(badge.id);
      const progress = this._getBadgeProgress(badge, data);

      return {
        ...badge,
        earned,
        progress,
      };
    });
  }

  _getBadgeProgress(badge, data) {
    const req = badge.requirement;
    const stats = data.stats;
    let current = 0;
    let total = req.count;

    switch (req.type) {
      case "tomatoes_completed":
        current = stats.tomatoesCompleted;
        break;
      case "streak":
        current = stats.longestStreak;
        break;
      case "total_minutes":
        current = stats.totalMinutes;
        break;
      case "morning_sessions":
        current = stats.morningSessionsCount;
        break;
      case "night_sessions":
        current = stats.nightSessionsCount;
        break;
      case "tomatoes_in_day":
        current = this._checkMaxTomatoesInDay(stats);
        break;
      case "perfect_week":
        current = this._checkPerfectWeeks(stats);
        break;
      case "days_worked_in_month":
        current = this._checkDaysWorkedInMonth(stats);
        break;
      default:
        current = 0;
    }

    const percentage = Math.min((current / total) * 100, 100);

    return {
      current,
      total,
      percentage: Math.round(percentage),
    };
  }

  async resetGamification() {
    const emptyData = {
      xp: 0,
      level: 1,
      earnedBadges: [],
      stats: {
        tomatoesCompleted: 0,
        shortBreaksCompleted: 0,
        longBreaksCompleted: 0,
        totalMinutes: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionDate: null,
        dailyStats: {},
        morningSessionsCount: 0,
        nightSessionsCount: 0,
        perfectWeeksCount: 0,
      },
      achievements: [],
      recentlyEarnedBadges: [],
    };
    await this._saveGamificationData(emptyData);
  }

  async exportGamificationData() {
    const data = await this.getData();
    return JSON.stringify(data, null, 2);
  }

  async importGamificationData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      await this._saveGamificationData(data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
