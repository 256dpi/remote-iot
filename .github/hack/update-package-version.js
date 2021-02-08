const fs = require('fs');
const path = require('path');

// check tag
const result = (process.env.GITHUB_REF || '').match(/.*v(\d+\.\d+\.\d+)/);
if (!result) {
  console.log('no tag ref found');
  return;
}

// get version
const version = result[1];
console.log('detected version ' + version);

// update package version
let file = path.resolve(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(file).toString());
pkg.version = version;
fs.writeFileSync(file, JSON.stringify(pkg, null, '  '));
console.log('updated package version');
