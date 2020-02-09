const fsExtra = require('fs-extra')
const fs = require('fs');
const root = process.cwd();

fsExtra.removeSync(`${root}/data`);

if (fs.existsSync(`${root}/o_data`)) {
    fsExtra.copySync(`${root}/o_data`, `${root}/data`);
    fsExtra.removeSync(`${root}/o_data`);
}
