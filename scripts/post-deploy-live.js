const { existsSync, removeSync, copySync, emptyDirSync } = require('fs-extra');
const { resolve } = require('path');
const root = process.cwd();

const data = resolve(root, 'data');
const tmpData = resolve(root, 'o_data');

emptyDirSync(data);
removeSync(data);

if (existsSync(tmpData)) {
    copySync(tmpData, data);
    emptyDirSync(tmpData);
    removeSync(tmpData);
}
