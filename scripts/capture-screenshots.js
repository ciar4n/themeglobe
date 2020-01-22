#!/usr/bin/env node

const Pageres = require('pageres');
const fs = require('fs');
const path = require('path');
const yamlFront = require('yaml-front-matter');
const gh = require('parse-github-url');
const { exec } = require('child_process');

const themesFolder = path.join(__dirname, '../content/theme');
const hiresImagesFolder = path.join(__dirname, '../static/capture');

const themeFiles = fs.readdirSync(themesFolder);
const lightHouseData = [];

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


    exec(`npx lighthouse ${url} --output json`, (error, stdout, stderr) => {
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
        return;
      }

      const ddd = {}
      ddd[`${provider}-${templateName}`] = {
        lighthouse: {
          performance: out.categories.performance.score * 100,
          bestPractices: out.categories['best-practices'].score * 100,
          accessibility: out.categories.accessibility.score * 100,
          seo: out.categories.seo.score * 100,
          pwa: out.categories.pwa.score * 100,
        }
      }
      lightHouseData.push(ddd);
      fs.writeFileSync(`${path.join(__dirname, '../data')}/themes-lh.json`, JSON.stringify(lightHouseData));
    });

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

const captureAll = () => {
  for (const theme of themeFiles) {
    captureWebScreenshot(theme)
  }
}

captureAll()
