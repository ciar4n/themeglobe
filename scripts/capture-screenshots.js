#!/usr/bin/env node

const Pageres = require('pageres');
const fs = require('fs');
const path = require('path');
const yamlFront = require('yaml-front-matter');
const gh = require('parse-github-url');

const themesFolder = path.join(__dirname, '../content/theme');
const hiresImagesFolder = path.join(__dirname, '../static/capture');

const themeFiles = fs.readdirSync(themesFolder);

console.log("******************")
console.log("Taking Screenshots")
console.log("******************")

captureWebScreenshot = async theme => {
  const data = fs.readFileSync(path.join(themesFolder, theme));
  const frontmatter = yamlFront.loadFront(data);
  let templateName = frontmatter.title;
  let provider = frontmatter.provider;

  if (frontmatter.disabled) {
    return false
  }

  if (provider) {
    let themeKey = `${provider}-${templateName}`.replace(/\s+/g, '-').toLowerCase();
    let themeImage = `${themeKey}.png`
    const url = frontmatter.demo

    if (fs.existsSync(path.join(hiresImagesFolder, themeImage))) {
      console.log(`${theme} skipped`)
      return false
    } else {
      console.log(`${theme} capturing`);
      const page = await new Pageres({
          delay: 3,
          filename: themeKey
        })
        .src(url, ['1500x1125'], {
          crop: true
        })
        .dest(hiresImagesFolder)
        .run();
      return page
    }
  }
  return false;
};

const captureAll = async () => {
  for (const theme of themeFiles) {
    await captureWebScreenshot(theme)
  }
}

captureAll()
