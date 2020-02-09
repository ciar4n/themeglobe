const fsExtra = require('fs-extra');
const fs = require('fs');
const root = process.cwd();

if (fs.existsSync(`${root}/o_data`)) {
    fsExtra.copySync(`${root}/o_data`, `${root}/data`);
}
