const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const { version } = require("./package.json");

module.exports = {
  mode: "development",
  entry: {
    background: "./src/background/background.js",
    panel: "./src/panel/panel.js",
    stats: "./src/stats/stats.js",
    options: "./src/options/options.js",
    tasks: "./src/tasks/tasks.js",
    sessionNote: "./src/sessionNote/sessionNote.js",
    achievements: "./src/achievements/achievements.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/[name].js",
    clean: true, // Webpack 5 built-in clean
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "usage",
                  corejs: 3,
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Panel - Tomato Clock",
      template: "src/panel/panel.html",
      filename: "panel/panel.html",
      chunks: ["panel"],
    }),
    new HtmlWebpackPlugin({
      title: "Stats - Tomato Clock",
      template: "src/stats/stats.html",
      filename: "stats/stats.html",
      chunks: ["stats"],
    }),
    new HtmlWebpackPlugin({
      title: "Options - Tomato Clock",
      template: "src/options/options.html",
      filename: "options/options.html",
      chunks: ["options"],
    }),
    new HtmlWebpackPlugin({
      title: "Tasks - Tomato Clock",
      template: "src/tasks/tasks.html",
      filename: "tasks/tasks.html",
      chunks: ["tasks"],
    }),
    new HtmlWebpackPlugin({
      title: "Session Complete - Tomato Clock",
      template: "src/sessionNote/sessionNote.html",
      filename: "sessionNote/sessionNote.html",
      chunks: ["sessionNote"],
    }),
    new HtmlWebpackPlugin({
      title: "Achievements - Tomato Clock",
      template: "src/achievements/achievements.html",
      filename: "achievements/achievements.html",
      chunks: ["achievements"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./src/manifest.json",
          to: "./manifest.json",
          transform(content) {
            const jsonContent = JSON.parse(content.toString());
            jsonContent.version = version;
            return JSON.stringify(jsonContent, null, 2);
          },
        },
        { from: "./src/assets", to: "./assets" },
      ],
    }),
  ],
  resolve: {
    extensions: [".js"],
  },
};
