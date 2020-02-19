#!/usr/bin/env node

const { post } = require('axios');
const { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } = require('fs');
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
  const dataFile = `data/${theme.replace('.md', '').replace(/\-/g, '_')}.json`
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
      throw new Error(er)
    }
  }

  if (lightHouseData[`${themeKey}`]) {
    console.log(`${data.theme} Lighthouse skipped, already processed`)
    return;
  }

  const themeData = JSON.stringify({
    url: url,
    replace: true,
    save: false
  });

  const opts = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  post('https://lighthouse-dot-webdotdevsite.appspot.com//lh/newaudit', themeData, opts)
    .then(function (response) {
      // handle success
      if (response.status === 200 || response.status === 201) {
        if (response.data && response.data.lhr) {
          const lightHouseData = {};
          const out = response.data.lhr;

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
        }
      }

    })
    .catch(function (error) {
      // handle error
      console.log(themeData);
      console.dir(error);
    })
    .then(function () {
      // always executed
    });
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme);
  }
})();
