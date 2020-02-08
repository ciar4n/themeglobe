const fsExtra = require('fs-extra')
const root = process.cwd();

fsExtra.removeSync(`${root}/data`);
fsExtra.copySync(`${root}/o_data`, `${root}/data`);
fsExtra.removeSync(`${root}/o_data`);
