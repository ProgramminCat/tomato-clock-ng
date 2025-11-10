# Tomato Clock NG

Tomato Clock NG is a simple browser extension for managing your productivity. It is a fork of [samueljun/tomato-clock](https://github.com/samueljun/tomato-clock). Use the extension to break down your work into 25 minute 'Tomato' intervals separated by short breaks. Use the long break after completing four Tomato intervals.

Features:

- Customizable timer lengths
- Browser notifications
- Stat tracking
- Task tracking with to-do list
- Per-task statistics
- **Session notes** - Add quick notes about what you accomplished after completing each tomato
- **Best time of day analysis** - Discover when you're most productive (morning/afternoon/evening/night)
- **Motivational quotes** - Receive inspirational messages between sessions to stay motivated
- **Dark mode** - Full dark theme option for comfortable viewing in any lighting condition
- **Gamification** - Earn XP, level up, unlock badges and achievements to stay motivated and track your productivity journey

You can customize the length of the Tomatoes and breaks in the extension page. The extension uses the default browser notification system, accompanied by a sound, to let you know when the timer is over. The extension also features stats for tracking how many Tomatoes you complete, and you can organize your work by creating tasks and tagging individual tomatoes with task names. View detailed statistics per task to understand where you're spending your time.

Please file any issues or feature requests at https://github.com/ProgramminCat/tomato-clock-ng/issues.

## Installation

- [Firefox AMO (Coming Soon)](https://example.com)
- [Chrome Web Store (Coming Soon)](https://example.com)

## Development

1. [Install node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

2. Install the required node modules:

```sh
npm install
```

3. Run the following command so that webpack can watch and recompile the `/src` files live to the `/dist` folder:

```sh
npm run watch
```

### Firefox

To run the extension with live reloading in a clean Firefox instance, run the following command in a separate terminal:

```sh
npm run watch-firefox
```

To temporarily load the extension in a normal Firefox instance:

1. Go to `about:debugging`
2. Click `Load Temporary Add-on`
3. Load the `src` folder, OR compile by running `npm run build` then load the `dist` folder

### Updating the version number

Run the following command with the appropriate `npm version {patch/minor/major}` to bump the package.json version based on [semver](http://semver.org/):

```sh
npm version patch && git push && git push --tags
```

### Building submission file

Run the following command so that webpack can recompile the `/src` files in production mode to the `/dist` folder:

```sh
npm run build
```

## Statistics JSON format

The expected formatting of Tomato Clock NG's .json files that store statistics is as follows

```json
{
  "specificationUrl": "https://github.com/ProgramminCat/tomato-clock-ng/?tab=readme-ov-file#statistics-json-format",
  "version": "6.0.3",
  "exportedAt": "2025-11-08T00:13:06.022Z",
  "data": [
    {
      "type": "tomato",
      "startTime": "2025-11-08T00:52:29.117Z",
      "endTime": "2025-11-08T00:53:29.117Z",
      "duration": 60000,
      "taskId": "1234567890"
    }
  ]
}
```

- At the base, there is metadata and an array [] of objects {}
- Each object {} under "data" is an instance of the clock timer.
- Within each object:
  - "duration": is the time in milliseconds of the timer
  - "type": is one of "tomato", "shortBreak", or "longBreak"
  - "startTime": is the exact date and time string in the [ISOString format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) of the time the timer started
  - "endTime": is the exact date and time string in the [ISOString format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) of the time the timer ended
  - "taskId": (optional) the ID of the task associated with this timer entry
  - "note": (optional) a text note describing what was accomplished during this session

## Task Management

Tomato Clock NG includes a comprehensive task management system:

- **Create and manage tasks**: Add tasks with names and descriptions
- **Track progress**: Each task automatically tracks the number of tomatoes completed and total minutes worked
- **Task selection**: When starting a tomato timer, optionally select a task to associate it with
- **Task statistics**: View detailed statistics showing how many tomatoes and minutes you've spent on each task
- **To-do list**: Mark tasks as complete when finished, and view active vs. completed tasks separately
- **Per-task analytics**: The stats page shows a breakdown of your tomato sessions by task, including percentage of total time

Tasks are stored locally and persist across browser sessions. Task data is separate from the timer statistics, so you can delete tasks without losing your tomato history.

## Gamification System

Tomato Clock NG includes a comprehensive gamification system to make productivity tracking more engaging and rewarding:

### Experience Points (XP) & Levels

- **Earn XP** for completing tomato sessions, short breaks, and long breaks
- **Level up** from Beginner (Level 1) to Mythic (Level 10) by accumulating XP
- **Streak bonuses** - Earn bonus XP for maintaining daily completion streaks
- **Progress tracking** - View your current level and progress to the next level in the panel

### Badges & Achievements

Unlock over 20 unique badges across 5 tiers:
- **Bronze**
- **Silver**
- **Gold**
- **Platinum**
- **Diamond**

Badge categories include:
- **Completion badges** - Unlock badges for reaching tomato milestones (10, 50, 100, 250, 500 tomatoes)
- **Streak badges** - Earn badges for maintaining daily streaks (3, 7, 30, 100 days)
- **Time-based badges** - Achieve badges for total focus time (10, 50, 100, 500 hours)
- **Daily performance** - Special badges for productive days (Early Bird, Night Owl, Super Productive)
- **Consistency badges** - Rewards for perfect weeks and monthly consistency

### Features

- **Real-time rewards** - See XP earned and badges unlocked immediately after completing sessions
- **Achievement tracking** - View all badges with progress indicators showing how close you are to unlocking them
- **Filtering & sorting** - Filter badges by status (earned/locked) and tier (bronze/silver/gold/platinum/diamond)
- **Level milestones** - Track your journey through 10 unique levels, each with its own name and icon
- **Export/Import** - Back up and restore your gamification progress
- **Streak system** - Build daily streaks to earn bonus XP and unlock special streak badges

Access the Achievements page from the extension panel to view your complete gamification profile, including level progress, earned badges, and statistics.
