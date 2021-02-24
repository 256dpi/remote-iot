const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const config = {
  packagerConfig: {
    asar: false, // required to access CLI
    appBundleId: 'com.256dpi.remote-iot',
    appCategoryType: 'public.app-category.developer-tools',
    appCopyright: `Copyright © ${new Date().getFullYear()} Joël Gähwiler. All rights reserved.`,
    executableName: 'remote-iot',
    ignore: [/\.gitignore/, /\.node-version/, /cli\.js/, /forge\.js/, /yarn\.lock/],
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'remote-iot',
        exe: 'remote-iot.exe',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          name: 'remote-iot',
          bin: 'remote-iot',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          name: 'remote-iot',
          bin: 'remote-iot',
        },
      },
    },
  ],
  hooks: {
    postMake: async (_, results) => {
      /* consistently name artifacts */

      // prepare rules
      const rules = [
        { test: /.*\.zip/, name: `remote-iot-${pkg.version}-${process.platform}.zip` },
        { test: /.*\.dmg/, name: `remote-iot-${pkg.version}.dmg` },
        { test: /.*\.exe/, name: `remote-iot-${pkg.version}.exe` },
        { test: /.*\.deb/, name: `remote-iot-${pkg.version}.deb` },
        { test: /.*\.rpm/, name: `remote-iot-${pkg.version}.rpm` },
        { test: /.*-full\.nupkg/, name: `remote-iot-${pkg.version}-full.nupkg` },
      ];

      // rename files
      results.forEach((result) => {
        result.artifacts.forEach((artifact) => {
          rules.forEach((rule) => {
            if (artifact.match(rule.test)) {
              fs.renameSync(artifact, path.join(path.dirname(artifact), rule.name));
            }
          });
        });
      });
    },
  },
};

module.exports = config;
