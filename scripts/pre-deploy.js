const fs = require('fs');
const fsExtra = require('fs-extra')
const root = process.cwd();
let combinedData = {};

fsExtra.move(`${root}/data`, `${root}/o_data`)
    .then(() => {
        fs.mkdirSync(`${root}/data`);
        const originalData = fs.readdirSync(`${root}/o_data`);

        for (const theme of originalData) {
            console.log(`${root}/o_data/${theme}`)
            processTheme(`${root}/o_data/${theme}`);
        }

        return combinedData;
    })
    .then((combinedData) => {
        fs.writeFileSync(`${root}/data/themes.json`, JSON.stringify(combinedData));
    })
    .catch(err => console.log(err));

const processTheme = (jsonFile) => {
    let sData;
    if (fs.existsSync(jsonFile)) {
        try {
            sData = JSON.parse(fs.readFileSync(jsonFile))
        } catch (er) {
            throw new Error(er)
        }
    }

    if (sData) {
        combinedData = { ...combinedData, ...sData }
    }
};
