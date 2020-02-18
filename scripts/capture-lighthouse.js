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
  const dataTmp = readFileSync(join(themesFolder, theme));
  const frontmatter = loadFront(dataTmp);
  const dataFile = `data/${theme.replace('.md', '').replace(/\-/g, '_')}.json`;

  const data = {
    theme: theme,
    frontmatter: frontmatter
  };

  if (frontmatter.disabled) {
    console.log('No FrontMatter data, skipping');
    return;
  }

  lh(data, dataFile);
};

const lh = async (data, dataFile) => {
  let lightHouseData = {};
  let templateName = data.frontmatter.title;
  let provider = data.frontmatter.provider;
  let themeKey = `${provider}-${templateName}`.replace(/\s+/g, '-').toLowerCase();
  let url = '';

  if (data.frontmatter.demo) {
    url = data.frontmatter.demo
  }
  if (data.frontmatter.audit) {
    url = data.frontmatter.audit
  }

  if (url === '') return;

  url += '?nocache=true'

  if (existsSync(dataFile)) {
    try {
      lightHouseData = JSON.parse(readFileSync(dataFile))
    } catch (er) {
      // Invalid JSON
      unlinkSync(dataFile);
    }
  }

  if (lightHouseData[`${themeKey}`]) {
    console.log(`${data.theme} Lighthouse skipped, already processed`)
    return;
  }

  console.log(`Processing: ${data.theme}`)

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
    'lighthouse', url,
    '--chrome-flags="--headless"',
    '--preset=full',
    '--throttling-method=simulate',
    `--throttling.cpuSlowdownMultiplier=${throttling.mobile3G.cpuSlowdownMultiplier}`,
    `--throttling.rttMs=${throttling.mobile3G.rttMs}`,
    `--throttling.throughputKbps=${throttling.mobile3G.throughputKbps}`,
    `--throttling.requestLatencyMs=${throttling.mobile3G.requestLatencyMs}`,
    `--throttling.downloadThroughputKbps=${throttling.mobile3G.downloadThroughputKbps}`,
    `--throttling.uploadThroughputKbps=${throttling.mobile3G.uploadThroughputKbps}`,
    '--quiet',
    '--output', 'json']);
  let out = {};
  try {
    out = JSON.parse(llh.stdout);
  } catch (err) {
    console.log(err);
    return
  }

  if (!out.audits) {
    return;
  }

  carbonVal = out.audits['resource-summary'].details.items[0].size / 1024 / 1024 / 1024 * 0.06 * 1000
  lightHouseData[`${themeKey}`] = {
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

  writeFileSync(dataFile, JSON.stringify(lightHouseData));
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme);
  }
})();
