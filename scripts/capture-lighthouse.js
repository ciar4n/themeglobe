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
const root = process.cwd();
const urlsForAudit = [];
const dataForAudit = [];

if (!existsSync(`${root}/data`)) {
  mkdirSync(`${root}/data`);
}

for (const [idx, theme] of readdirSync(themesFolder).entries()) {
  if (theme.startsWith("_")) {
    continue;
  }
  if (['icetheme-zen.md', 'joomlashine-ares.md'].includes(theme)) { continue; }

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

  let lightHouseDataTmp = false;

  if (existsSync(themeJsonFilename)) {
    try {
      lightHouseDataTmp = JSON.parse(readFileSync(themeJsonFilename));
    } catch (er) {
      // Invalid JSON
      unlinkSync(themeJsonFilename);
    }
  }

  if (lightHouseDataTmp) {
    continue;
  }

  urlsForAudit.push(url);
  dataForAudit.push({
    themeName: theme,
    themeKey: themeKey,
    themeUrl: url,
    themeJsonFilename: themeJsonFilename,
    lightHouseData: {},
  });
}

(async () => {
  const fData = await PerfLeaderboard(urlsForAudit, 3, { launchOptions: {} });

  fData.forEach(fd => {
    dataForAudit.forEach(data => {
      if (fd.requestedUrl.includes(data.themeUrl)) {
        carbonVal = (fd.weight.total / 1024 / 1024 / 1024) * 0.06 * 1000;
        const tempCur = {
          performance: (Math.round((fd.lighthouse.performance + Number.EPSILON) * 100) / 100) * 100,
          bestPractices: (Math.round((fd.lighthouse.bestPractices + Number.EPSILON) * 100) / 100) * 100,
          accessibility: (Math.round((fd.lighthouse.accessibility + Number.EPSILON) * 100) / 100) * 100,
          seo: (Math.round((fd.lighthouse.seo + Number.EPSILON) * 100) / 100) * 100,
          carbon: carbonVal.toFixed(3),
          firstContentfulPaint: (Math.round((fd.firstContentfulPaint + Number.EPSILON) * 100) / 100),
          firstMeaningfulPaint: (Math.round((fd.largestContentfulPaint + Number.EPSILON) * 100) / 100),
          firstCPUIdle: (Math.round((fd.totalBlockingTime + Number.EPSILON) * 100) / 100),
          interactive: (Math.round((fd.timeToInteractive + Number.EPSILON) * 100) / 100),
        };

        writeFileSync(data.themeJsonFilename, JSON.stringify({ [`${data.themeKey}`]: tempCur }));
      }
    })
  })
})();
