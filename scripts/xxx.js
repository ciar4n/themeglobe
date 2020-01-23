#!/usr/bin/env node

const Pageres = require('pageres');
const fs = require('fs');
const path = require('path');
const yamlFront = require('yaml-front-matter');
const { exec } = require('child_process');

const themesFolder = path.join(__dirname, '../content/theme');
const hiresImagesFolder = path.join(__dirname, '../static/capture');

const themeFiles = fs.readdirSync(themesFolder);

let lightHouseData = [];

if (fs.existsSync(`${path.join(__dirname, '../data')}/themes-lh.json`)) {
    const tmpLhData = fs.readFileSync(`${path.join(__dirname, '../data')}/themes-lh.json`);
    try {
        lightHouseData = JSON.parse(tmpLhData)
    } catch (er) {
        console.log(er)
    }
}

console.log("******************")
console.log("Taking Screenshots")
console.log("******************")

const processTheme = (theme) => {
    return new Promise((resolve, reject) => {
        const dataTmp = fs.readFileSync(path.join(themesFolder, theme));
        const frontmatter = yamlFront.loadFront(dataTmp);
        const data = {
            theme: theme,
            frontmatter: frontmatter
        };

        if (frontmatter.disabled) {
            return reject('Processed already')
        }

        return resolve(data)
    })
}

const screenshot = async (data) => {
    let templateName = data.frontmatter.title;
    let provider = data.frontmatter.provider;

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

const lh = (data) => {
    let templateName = data.frontmatter.title;
    let provider = data.frontmatter.provider;
    const url = data.frontmatter.demo

    return new Promise((resolve, reject) => {
        let processed = false
        lightHouseData.forEach(l => {
            if (l.hasOwnProperty(`${provider}-${templateName}`)) {
                processed = true;
            }
        })

        if (processed) {
            resolve();
            return;
        }

        exec(`npx lighthouse ${url} --output json`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(error)
                return;
            }
            // console.log(`stdout: ${stdout}`);
            // console.error(`stderr: ${stderr}`);
            let out = {};
            try {
                out = JSON.parse(stdout);
            } catch (err) {
                console.log(err);
                reject(err)
                return
            }
            const ddd = {};
            ddd[`${provider}-${templateName}`] = {
                lighthouse: {
                    performance: Math.ceil(out.categories.performance.score * 100),
                    bestPractices: Math.ceil(out.categories['best-practices'].score * 100),
                    accessibility: Math.ceil(out.categories.accessibility.score * 100),
                    seo: Math.ceil(out.categories.seo.score * 100),
                    pwa: Math.ceil(out.categories.pwa.score * 100),
                }
            }

            resolve(ddd)
        });
    })

};

const updateThemesData = (data) => {
    if (data) {
        lightHouseData.push(data);
        fs.writeFileSync(`${path.join(__dirname, '../data')}/themes-lh.json`, JSON.stringify(lightHouseData));
    }
}
const captureAll = async () => {
    for (const theme of themeFiles) {
        await processTheme(theme)
            .then(screenshot)
            .then(lh)
            .then(updateThemesData)
            .catch(err => {
                console.log(err);
            })
    }
}

captureAll()
