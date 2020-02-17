const { existsSync, move, mkdirSync, readdirSync, writeFileSync } = require('fs-extra');
const root = process.cwd();
let combinedData = {};

move(`${root}/data`, `${root}/o_data`)
    .then(() => {
        mkdirSync(`${root}/data`);
        const originalData = readdirSync(`${root}/o_data`);

        for (const theme of originalData) {
            console.log(`${root}/o_data/${theme}`)
            processTheme(`${root}/o_data/${theme}`);
        }

        return combinedData;
    })
    .then((combinedData) => {
        writeFileSync(`${root}/data/themes.json`, JSON.stringify(combinedData));
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
