const { readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
const fileThemes = join(__dirname, "../data/themes.json");
let fileData = false;

if (existsSync(fileThemes)) {
    fileData = JSON.parse(readFileSync(fileThemes));
}


const sortElements = ({ items, sortBy, direction, maxItems, fileName }) => {
    let resultItems = Object.entries(items);
    resultItems = resultItems.map((n) => ({ id: n[0], ...n[1] }));
    if (direction === 'asc') {
        resultItems = resultItems.sort(({ [sortBy]: a }, { [sortBy]: b }) => a - b);
    } else {
        resultItems = resultItems.sort(({ [sortBy]: a }, { [sortBy]: b }) => b - a);
    }

    resultItems.length = maxItems - 1;
    const PerformanceFinal = {};

    resultItems.forEach(key => {
        PerformanceFinal[key.id] = fileData[key.id];
    });

    writeFileSync(join(__dirname, `../data/${fileName}.json`), JSON.stringify(PerformanceFinal), { encoding: 'utf8' });
};

if (fileData) {
    sortElements({
        items: fileData,
        sortBy: 'performance',
        direction: 'desc',
        maxItems: 13,
        fileName: 'performance',
    });

    sortElements({
        items: fileData,
        sortBy: 'accessibility',
        direction: 'desc',
        maxItems: 13,
        fileName: 'accessibility',
    });

    sortElements({
        items: fileData,
        sortBy: 'seo',
        direction: 'desc',
        maxItems: 13,
        fileName: 'seo',
    });

    sortElements({
        items: fileData,
        sortBy: 'best-practices',
        direction: 'desc',
        maxItems: 13,
        fileName: 'bestpractices',
    });
}
