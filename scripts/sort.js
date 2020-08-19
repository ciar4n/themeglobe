const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");
const fileData = JSON.parse(readFileSync(join(__dirname, "../data/themes.json")))

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

sortElements({
    items: fileData,
    sortBy: 'performance',
    direction: 'desc',
    maxItems: 12,
    fileName: 'performance',
});

sortElements({
    items: fileData,
    sortBy: 'accessibility',
    direction: 'desc',
    maxItems: 12,
    fileName: 'accessibility',
});

sortElements({
    items: fileData,
    sortBy: 'seo',
    direction: 'desc',
    maxItems: 12,
    fileName: 'seo',
});

sortElements({
    items: fileData,
    sortBy: 'best-practices',
    direction: 'desc',
    maxItems: 12,
    fileName: 'best-practices',
});
