const { existsSync, removeSync, copySync } = require('fs-extra')
const root = process.cwd();

removeSync(`${root}/data`);

if (existsSync(`${root}/o_data`)) {
  copySync(`${root}/o_data`, `${root}/data`);
  removeSync(`${root}/o_data`);
}
