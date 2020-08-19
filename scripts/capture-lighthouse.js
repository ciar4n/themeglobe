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
let lightHouseData = {};

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

  if (existsSync(themeJsonFilename)) {
    let lightHouseDataTmp;
    try {
      lightHouseDataTmp = JSON.parse(readFileSync(themeJsonFilename));
    } catch (er) {
      // Invalid JSON
      unlinkSync(themeJsonFilename);
    }

    if (lightHouseDataTmp) {
      lightHouseData[`${themeKey}`] = lightHouseDataTmp[`${themeKey}`];
      continue;
    }
  }

  if (10 < idx < 21) {
    urlsForAudit.push(url);
    dataForAudit.push({
      themeName: theme,
      themeKey: themeKey,
      themeUrl: url,
      themeJsonFilename: themeJsonFilename,
      lightHouseData: {},
    });
  }
}

(async () => {
  // const existingUrls = await reachableUrls(urlsForAudit.join(' '));

  // console.dir(existingUrls)
  // return;

  const fData = await PerfLeaderboard(urlsForAudit, 3, { launchOptions: {} });

  fData.forEach(fd => {
    dataForAudit.forEach(data => {
      if (fd.requestedUrl.includes(data.themeUrl)) {
        const tempVal = {};
        carbonVal = (fd.weight.total / 1024 / 1024 / 1024) * 0.06 * 1000;
        const tempCur = {
          performance: fd.lighthouse.performance * 100,
          bestPractices: fd.lighthouse.bestPractices * 100,
          accessibility: fd.lighthouse.accessibility * 100,
          seo: fd.lighthouse.seo * 100,
          carbon: carbonVal.toFixed(3),
          firstContentfulPaint: Math.ceil(fd.firstContentfulPaint / 100) / 10,
          firstMeaningfulPaint: Math.ceil(fd.largestContentfulPaint / 100) / 10,
          firstCPUIdle: Math.ceil(fd.totalBlockingTime / 100) / 10,
          interactive: Math.ceil(fd.timeToInteractive / 100) / 10,
        };
        tempVal[`${data.themeKey}`] = tempCur;
        lightHouseData[`${data.themeKey}`] = tempCur;
        writeFileSync(data.themeJsonFilename, JSON.stringify(tempVal));
      }
    })
  })

  writeFileSync(join(__dirname, `../data/themes.json`), JSON.stringify(lightHouseData), { encoding: 'utf8' });
  // writeFileSync(join(__dirname, `../data/test.json`), JSON.stringify(fData), { encoding: 'utf8' });
})();
