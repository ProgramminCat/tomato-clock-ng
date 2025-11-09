export const NOTIFICATION_ID = "tomatoClockNotification";

export const STORAGE_KEY = {
  TIMELINE: "timeline",
  SETTINGS: "settings",
  TASKS: "tasks",
};

export const SETTINGS_KEY = {
  MINUTES_IN_TOMATO: "minutesInTomato",
  MINUTES_IN_SHORT_BREAK: "minutesInShortBreak",
  MINUTES_IN_LONG_BREAK: "minutesInLongBreak",
  IS_NOTIFICATION_SOUND_ENABLED: "isNotificationSoundEnabled",
  IS_TOOLBAR_BADGE_ENABLED: "isToolbarBadgeEnabled",
  IS_DARK_MODE_ENABLED: "isDarkModeEnabled",
  IS_MOTIVATIONAL_QUOTES_ENABLED: "isMotivationalQuotesEnabled",
};

export const DEFAULT_SETTINGS = {
  [SETTINGS_KEY.MINUTES_IN_TOMATO]: 25,
  [SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: 5,
  [SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: 15,
  [SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: false,
  [SETTINGS_KEY.IS_TOOLBAR_BADGE_ENABLED]: true,
  [SETTINGS_KEY.IS_DARK_MODE_ENABLED]: false,
  [SETTINGS_KEY.IS_MOTIVATIONAL_QUOTES_ENABLED]: true,
};

export const TIMER_TYPE = {
  TOMATO: "tomato",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

export const BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE = {
  [TIMER_TYPE.TOMATO]: "#dc3545",
  [TIMER_TYPE.SHORT_BREAK]: "#666",
  [TIMER_TYPE.LONG_BREAK]: "#666",
};

export const RUNTIME_ACTION = {
  SET_TIMER: "setTimer",
  RESET_TIMER: "resetTimer",
  GET_TIMER_SCHEDULED_TIME: "getTimerScheduledTime",
};

export const DATE_UNIT = {
  DATE: "day",
  MONTH: "month",
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MOTIVATIONAL_QUOTES = [
  "Focus is the key to productivity.",
  "Great things are done by a series of small things brought together.",
  "One tomato at a time leads to success.",
  "The secret of getting ahead is getting started.",
  "Progress, not perfection.",
  "Small steps every day lead to big results.",
  "You're doing great! Keep going.",
  "Every tomato brings you closer to your goal.",
  "Consistency is the path to mastery.",
  "Take a break, you've earned it!",
  "Focus on progress, not perfection.",
  "Your dedication is inspiring.",
  "Rest is productive too.",
  "One task at a time, one tomato at a time.",
  "You're building momentum!",
  "Stay focused, stay productive.",
  "Break time! Recharge and return stronger.",
  "Excellence is a habit, not an act.",
  "Keep up the great work!",
  "Time well spent is never wasted.",
];

export const TIME_OF_DAY = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  EVENING: "evening",
  NIGHT: "night",
};

export const TIME_OF_DAY_LABELS = {
  [TIME_OF_DAY.MORNING]: "Morning (6am-12pm)",
  [TIME_OF_DAY.AFTERNOON]: "Afternoon (12pm-6pm)",
  [TIME_OF_DAY.EVENING]: "Evening (6pm-10pm)",
  [TIME_OF_DAY.NIGHT]: "Night (10pm-6am)",
};
