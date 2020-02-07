#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yamlFront = require('yaml-front-matter');

const themesFolder = path.join(__dirname, '../content/joomla');
const themeFiles = fs.readdirSync(themesFolder);
let lightHouseData = {};

if (fs.existsSync(`${path.join(__dirname, '../data')}/themes.json`)) {
  const tmpLhData = fs.readFileSync(`${path.join(__dirname, '../data')}/themes.json`);
  try {
    lightHouseData = JSON.parse(tmpLhData)
  } catch (er) {
    throw new Error(er)
  }
}

const processTheme = (theme) => {
  const dataTmp = fs.readFileSync(path.join(themesFolder, theme));
  const frontmatter = yamlFront.loadFront(dataTmp);
  const data = {
    theme: theme,
    frontmatter: frontmatter
  };

  if (frontmatter.disabled) {
    console.log('No FrontMatter data, skipping');
    return;
  }

  lh(data);
};

const lh = async (data) => {
  let templateName = data.frontmatter.title;
  let provider = data.frontmatter.provider;
  let themeKey = `${provider}-${templateName}`.replace(/\s+/g, '-').toLowerCase();
  const url = data.frontmatter.demo

  if (lightHouseData[`${themeKey}`]) {
    console.log(`${data.theme} Lighthouse skipped, already processed`)
    return;
  }

  const d = JSON.stringify({
    url: url,
    replace: true,
    save: false
  });

  const o = {
    headers: {
      'Content-Type': 'application/json',
    }
  };

  axios.post('https://lighthouse-dot-webdotdevsite.appspot.com//lh/newaudit', d, o)
    .then(function(response) {
      // handle success
      if (response.status === 200 || response.status === 201) {
        if (response.data && response.data.lhr) {
          const out = response.data.lhr;

          if (!lightHouseData.hasOwnProperty([`${themeKey}`])) {
            carbonVal = out.audits['resource-summary'].details.items[0].size / 1024 / 1024 / 1024 * 0.06 * 1000
            lightHouseData[`${themeKey}`] = {
              performance: Math.ceil(out.categories.performance.score * 100),
              bestPractices: Math.ceil(out.categories['best-practices'].score * 100),
              accessibility: Math.ceil(out.categories.accessibility.score * 100),
              seo: Math.ceil(out.categories.seo.score * 100),
              carbon: carbonVal.toFixed(3),
            };
          }

          fs.writeFileSync(`${path.join(__dirname, '../data')}/themes.json`, JSON.stringify(lightHouseData));

        }
      }

    })
    .catch(function(error) {
      // handle error
      console.log(error);
    })
    .then(function() {
      // always executed
    });
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme);
  }
})();
