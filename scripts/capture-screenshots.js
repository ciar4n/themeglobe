#!/usr/bin/env node

const Pageres = require('pageres');
const fs = require('fs');
const path = require('path');
const yamlFront = require('yaml-front-matter');
const {
  exec
} = require('child_process');

const themesFolder = path.join(__dirname, '../content/joomla');
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

const screenshot = async (data) => {
  let templateName = data.frontmatter.title;
  let provider = data.frontmatter.provider;
  const url = data.frontmatter.demo

  if (provider) {
    let themeKey = `${provider}-${templateName}`.replace(/\s+/g, '-').toLowerCase();
    let themeImage = `${themeKey}.png`

    if (fs.existsSync(path.join(hiresImagesFolder, themeImage))) {
      console.log(`${data.theme} skipped`)
      return data
    } else {
      console.log(`${data.theme} capturing`);
      await new Pageres({
          delay: 3,
          filename: themeKey
        })
        .src(url, ['1500x1125'], {
          crop: true
        })
        .dest(hiresImagesFolder)
        .run();
      return data
    }
  }
  return data;
};

(() => {
  for (const theme of themeFiles) {
    processTheme(theme)
      .then(screenshot)
      .catch(err => {
        console.log(err);
      })
  }
})();
