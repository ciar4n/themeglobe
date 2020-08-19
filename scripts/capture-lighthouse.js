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
      // Fix the floating nums
      // const newNums = {
      //   performance: (Math.round((lightHouseDataTmp[`${themeKey}`].performance + Number.EPSILON) * 100) / 100),
      //   bestPractices: (Math.round((lightHouseDataTmp[`${themeKey}`].bestPractices + Number.EPSILON) * 100) / 100),
      //   accessibility: (Math.round((lightHouseDataTmp[`${themeKey}`].accessibility + Number.EPSILON) * 100) / 100),
      //   seo: (Math.round((lightHouseDataTmp[`${themeKey}`].seo + Number.EPSILON) * 100) / 100),
      //   carbon: lightHouseDataTmp[`${themeKey}`].carbon,
      //   firstContentfulPaint: (Math.round((lightHouseDataTmp[`${themeKey}`].firstContentfulPaint + Number.EPSILON) * 100) / 100),
      //   firstMeaningfulPaint: (Math.round((lightHouseDataTmp[`${themeKey}`].firstMeaningfulPaint + Number.EPSILON) * 100) / 100),
      //   firstCPUIdle: (Math.round((lightHouseDataTmp[`${themeKey}`].firstCPUIdle + Number.EPSILON) * 100) / 100),
      //   interactive: (Math.round((lightHouseDataTmp[`${themeKey}`].interactive + Number.EPSILON) * 100) / 100),
      // }
      // writeFileSync(themeJsonFilename, JSON.stringify({ [`${themeKey}`]: newNums }));

      lightHouseData[`${themeKey}`] = newNums;
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
          performance: (Math.round((fd.lighthouse.performance + Number.EPSILON) * 100) / 100),
          bestPractices: (Math.round((fd.lighthouse.bestPractices + Number.EPSILON) * 100) / 100),
          accessibility: (Math.round((fd.lighthouse.accessibility + Number.EPSILON) * 100) / 100),
          seo: (Math.round((fd.lighthouse.seo + Number.EPSILON) * 100) / 100),
          carbon: carbonVal.toFixed(3),
          firstContentfulPaint: (Math.round((fd.firstContentfulPaint + Number.EPSILON) * 100) / 100),
          firstMeaningfulPaint: (Math.round((fd.largestContentfulPaint + Number.EPSILON) * 100) / 100),
          firstCPUIdle: (Math.round((fd.totalBlockingTime + Number.EPSILON) * 100) / 100),
          interactive: (Math.round((fd.timeToInteractive + Number.EPSILON) * 100) / 100),
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
