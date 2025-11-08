# Tomato Clock NG

Tomato Clock NG is a simple browser extension for managing your productivity. It is a fork of [samueljun/tomato-clock](https://github.com/samueljun/tomato-clock). Use the extension to break down your work into 25 minute 'Tomato' intervals separated by short breaks. Use the long break after completing four Tomato intervals.

Features:

- Customizable timer lengths
- Browser notifications
- Stat tracking

You can customize the length of the Tomatoes and breaks in the extension page. The extension uses the default browser notification system, accompanied by a sound, to let you know when the timer is over. The extension also features stats for tracking how many Tomatoes you complete. Your stats are synced across devices using the browser's cloud storage support.

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
      "duration": 60000
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
