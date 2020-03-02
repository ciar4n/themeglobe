const { existsSync, move, mkdirSync, readFileSync, readdirSync, writeFileSync } = require('fs-extra');
const { resolve } = require('path');
const root = process.cwd();

const data = resolve(root, 'data');
const tmpData = resolve(root, 'o_data');
let combinedData = {};

move(data, tmpData)
    .then(() => {
        mkdirSync(data);
        const originalData = readdirSync(tmpData);

        for (const theme of originalData) {
            console.log(`${tmpData}/${theme}`)
            processTheme(`${tmpData}/${theme}`);
        }

        return combinedData;
    })
    .then((combinedData) => {
        writeFileSync(`${data}/themes.json`, JSON.stringify(combinedData));
    })
    .catch(err => console.log(err));

const processTheme = (jsonFile) => {
    let sData;
    if (existsSync(jsonFile)) {
        try {
            sData = JSON.parse(readFileSync(jsonFile))
        } catch (er) {
            throw new Error(er)
        }
    }

    if (sData) {
        combinedData = { ...combinedData, ...sData }
    }
};
