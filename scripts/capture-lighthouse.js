#!/usr/bin/env node

const Pageres = require('pageres');
const fs = require('fs');
const path = require('path');
const yamlFront = require('yaml-front-matter');
const {
  exec
} = require('child_process');

const themesFolder = path.join(__dirname, '../content/theme');
const hiresImagesFolder = path.join(__dirname, '../static/capture');

const themeFiles = fs.readdirSync(themesFolder);

let lightHouseData = {};

if (fs.existsSync(`${path.join(__dirname, '../data')}/themes.json`)) {
  const tmpLhData = fs.readFileSync(`${path.join(__dirname, '../data')}/themes.json`);
  try {
    lightHouseData = JSON.parse(tmpLhData)
  } catch (er) {
    console.log(er)
  }
}

const processTheme = (theme) => {
  return new Promise((resolve, reject) => {
    const dataTmp = fs.readFileSync(path.join(themesFolder, theme));
    const frontmatter = yamlFront.loadFront(dataTmp);
    const data = {
      theme: theme,
      frontmatter: frontmatter
    };

    if (frontmatter.disabled) {
      return reject('No FrontMatter data, skipping')
    }

    return resolve(data)
  })
}

const lh = (data) => {
  let templateName = data.frontmatter.title;
  let provider = data.frontmatter.provider;
  let themeKey = `${provider}-${templateName}`.replace(/\s+/g, '-').toLowerCase();
  const url = data.frontmatter.demo

  if (lightHouseData[`${themeKey}`]) {
    console.log(`${data.theme} Lighthouse skipped, already processed`)
    return;
  }

  exec(`npx lighthouse ${url} --chrome-flags="--headless" --output json`, {
    maxBuffer: 1024 * 1024 * 10
  }, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    // console.log(`stdout: ${stdout}`);
    // console.error(`stderr: ${stderr}`);
    let out = {};
    try {
      out = JSON.parse(stdout);
    } catch (err) {
      console.log(err);
      return
    }

    if (!lightHouseData.hasOwnProperty([`${themeKey}`])) {
      lightHouseData[`${themeKey}`] = {
        performance: Math.ceil(out.categories.performance.score * 100),
        bestPractices: Math.ceil(out.categories['best-practices'].score * 100),
        accessibility: Math.ceil(out.categories.accessibility.score * 100),
        seo: Math.ceil(out.categories.seo.score * 100),
        pwa: Math.ceil(out.categories.pwa.score * 100),
      };
    }

    fs.writeFileSync(`${path.join(__dirname, '../data')}/themes.json`, JSON.stringify(lightHouseData));

  });
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme)
      .then(lh)
      .catch(err => {
        console.log(err);
      })
  }
})();
