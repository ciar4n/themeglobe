#!/usr/bin/env node

const PerfLeaderboard = require("performance-leaderboard");
const {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} = require("fs");
const { join } = require("path");
const { loadFront } = require("yaml-front-matter");

const themesFolder = join(__dirname, "../content/theme");
const themeFiles = readdirSync(themesFolder);
const root = process.cwd();

if (!existsSync(`${root}/data`)) {
  mkdirSync(`${root}/data`);
}

const processTheme = (theme) => {
  const frontmatter = loadFront(readFileSync(join(themesFolder, theme)));
  const themeJsonFilename = `data/${theme
    .replace(".md", "")
    .replace(/\-/g, "_")}.json`;
  const themeKey = `${frontmatter.provider}-${frontmatter.title}`
    .replace(/\s+/g, "-")
    .toLowerCase();

  if (frontmatter.disabled) {
    console.log("No FrontMatter data, skipping");
    return;
  }

  let url = "";

  if (frontmatter.demo) {
    url = frontmatter.demo;
  }
  if (frontmatter.audit) {
    url = frontmatter.audit;
  }

  let lightHouseData = {};

  if (existsSync(themeJsonFilename)) {
    try {
      lightHouseData = JSON.parse(readFileSync(themeJsonFilename));
    } catch (er) {
      // Invalid JSON
      unlinkSync(themeJsonFilename);
      lightHouseData = {};
    }
  }

  if (
    lightHouseData[`${themeKey}`] ||
    // The following url is breaking the script
    theme === "joomlashine-ares.md"
  ) {
    // console.log(`${theme} Lighthouse skipped, already processed`)
    return;
  }

  lh({
    themeName: theme,
    themeKey: themeKey,
    themeUrl: url,
    themeJsonFilename: themeJsonFilename,
    lightHouseData: {},
  });
};

const lh = async (data) => {
  if (data.themeUrl === "") return;

  const lightHouseData = {};

  data.themeUrl += "?nocache=true";

  console.log(`Processing: ${data.themeName}`);

  const outputData = await PerfLeaderboard([data.themeUrl]);

  out = outputData[0];

  carbonVal = (out.weight.total / 1024 / 1024 / 1024) * 0.06 * 1000;
  lightHouseData[`${data.themeKey}`] = {
    performance: out.lighthouse.performance * 100,
    firstContentfulPaint: Math.ceil(out.firstContentfulPaint / 100) / 10,
    firstMeaningfulPaint: Math.ceil(out.largestContentfulPaint / 100) / 10,
    firstCPUIdle: Math.ceil(out.totalBlockingTime / 100) / 10,
    interactive: Math.ceil(out.timeToInteractive / 100) / 10,
    bestPractices: out.lighthouse.bestPractices * 100,
    accessibility: out.lighthouse.accessibility * 100,
    seo: out.lighthouse.seo * 100,
    carbon: carbonVal.toFixed(3),
  };

  writeFileSync(data.themeJsonFilename, JSON.stringify(lightHouseData));
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme);
  }
})();
