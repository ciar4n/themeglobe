const { existsSync, copySync } = require('fs-extra');
const root = process.cwd();

if (existsSync(`${root}/o_data`)) {
    copySync(`${root}/o_data`, `${root}/data`);
}
