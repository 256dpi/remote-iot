const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const config = {
  packagerConfig: {
    asar: false, // required to access CLI
    appBundleId: 'com.256dpi.remotiot',
    appCategoryType: 'public.app-category.developer-tools',
    appCopyright: `Copyright © ${new Date().getFullYear()} Joël Gähwiler. All rights reserved.`,
    executableName: 'remotiot',
    ignore: [/\.gitignore/, /\.node-version/, /cli\.js/, /forge\.js/, /yarn\.lock/],
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'remotiot',
        exe: 'remotiot.exe',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          name: 'remotiot',
          bin: 'remotiot',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          name: 'remotiot',
          bin: 'remotiot',
        },
      },
    },
  ],
  hooks: {
    postMake: async (_, results) => {
      /* consistently name artifacts */

      // prepare rules
      const rules = [
        { test: /.*\.zip/, name: `remotiot-${pkg.version}-${process.platform}.zip` },
        { test: /.*\.dmg/, name: `remotiot-${pkg.version}.dmg` },
        { test: /.*\.exe/, name: `remotiot-${pkg.version}.exe` },
        { test: /.*\.deb/, name: `remotiot-${pkg.version}.deb` },
        { test: /.*\.rpm/, name: `remotiot-${pkg.version}.rpm` },
        { test: /.*-full\.nupkg/, name: `remotiot-${pkg.version}-full.nupkg` },
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
