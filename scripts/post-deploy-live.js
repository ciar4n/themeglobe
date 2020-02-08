const fsExtra = require('fs-extra')
const root = process.cwd();


if (fs.esxistsSync(`${root}/o_data`)) {
    fsExtra.copySync(`${root}/o_data`, `${root}/data`);
}
