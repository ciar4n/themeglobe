#!/usr/bin/env node

const { spawnSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } = require('fs');
const { join } = require('path');
const { loadFront } = require('yaml-front-matter');

const themesFolder = join(__dirname, '../content/joomla');
const themeFiles = readdirSync(themesFolder);
const root = process.cwd();

if (!existsSync(`${root}/data`)) {
  mkdirSync(`${root}/data`);
}

const processTheme = (theme) => {
  const frontmatter = loadFront(readFileSync(join(themesFolder, theme)));
  const themeJsonFilename = `data/${theme.replace('.md', '').replace(/\-/g, '_')}.json`;
  const themeKey = `${frontmatter.provider}-${frontmatter.title}`.replace(/\s+/g, '-').toLowerCase();

  if (frontmatter.disabled) {
    console.log('No FrontMatter data, skipping');
    return;
  }

  let url = '';

  if (frontmatter.demo) {
    url = frontmatter.demo
  }
  if (frontmatter.audit) {
    url = frontmatter.audit
  }


  let lightHouseData = {};

  if (existsSync(themeJsonFilename)) {
    try {
      lightHouseData = JSON.parse(readFileSync(themeJsonFilename))
    } catch (er) {
      // Invalid JSON
      unlinkSync(themeJsonFilename);
      lightHouseData = {}
    }
  }

  if (lightHouseData[`${themeKey}`]
    // The following url is breaking the script
    || theme === 'joomlashine-ares.md'
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
  if (data.themeUrl === '') return;

  const lightHouseData = {};

  data.themeUrl += '?nocache=true'

  console.log(`Processing: ${data.themeName}`)

  const DEVTOOLS_RTT_ADJUSTMENT_FACTOR = 3.75;
  const DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR = 0.9;

  // https://github.com/GoogleChrome/lighthouse/blob/8f500e00243e07ef0a80b39334bedcc8ddc8d3d0/lighthouse-core/config/constants.js#L16-L27
  const throttling = {
    DEVTOOLS_RTT_ADJUSTMENT_FACTOR,
    DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR,
    mobile3G: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      requestLatencyMs: 150 * DEVTOOLS_RTT_ADJUSTMENT_FACTOR,
      downloadThroughputKbps: 1.6 * 1024 * DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR,
      uploadThroughputKbps: 750 * DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR,
      cpuSlowdownMultiplier: 4,
    },
  };

  // The code is intentionally synchronous! Do not promisify!!!
  const llh = spawnSync('npx', [
    'lighthouse', data.themeUrl,
    '--chrome-flags="--headless"',
    '--emulated-form-factor=mobile',
    '--throttling-method=devtools',
    `--throttling.cpuSlowdownMultiplier=${throttling.mobile3G.cpuSlowdownMultiplier}`,
    `--throttling.rttMs=${throttling.mobile3G.rttMs}`,
    `--throttling.throughputKbps=${throttling.mobile3G.throughputKbps}`,
    `--throttling.requestLatencyMs=${throttling.mobile3G.requestLatencyMs}`,
    `--throttling.downloadThroughputKbps=${throttling.mobile3G.downloadThroughputKbps}`,
    `--throttling.uploadThroughputKbps=${throttling.mobile3G.uploadThroughputKbps}`,
    '--quiet',
    '--output=json']);

  let out = {};
  try {
    out = JSON.parse(llh.stdout);
  } catch (err) {
    console.log(`${data.themeUrl} was skipped due to error from LH`);
    out = {};
  }

  if (!out.audits) {
    return;
  }

  carbonVal = out.audits['resource-summary'].details.items[0].size / 1024 / 1024 / 1024 * 0.06 * 1000
  lightHouseData[`${data.themeKey}`] = {
    performance: Math.ceil(out.categories.performance.score * 100),
    firstContentfulPaint: Math.ceil(out.audits.metrics.details.items[0].firstContentfulPaint / 100) / 10,
    firstMeaningfulPaint: Math.ceil(out.audits.metrics.details.items[0].firstMeaningfulPaint / 100) / 10,
    firstCPUIdle: Math.ceil(out.audits.metrics.details.items[0].firstCPUIdle / 100) / 10,
    interactive: Math.ceil(out.audits.metrics.details.items[0].interactive / 100) / 10,
    bestPractices: Math.ceil(out.categories['best-practices'].score * 100),
    accessibility: Math.ceil(out.categories.accessibility.score * 100),
    seo: Math.ceil(out.categories.seo.score * 100),
    carbon: carbonVal.toFixed(3),
  }

  writeFileSync(data.themeJsonFilename, JSON.stringify(lightHouseData));
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme);
  }
})();
