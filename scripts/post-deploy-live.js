const fsExtra = require('fs-extra')
const root = process.cwd();

fsExtra.removeSync(`${root}/o_data`);
