const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const config = {
  packagerConfig: {
    asar: false, // required to access CLI
    appBundleId: 'com.256dpi.remotiot-bridge',
    appCategoryType: 'public.app-category.developer-tools',
    appCopyright: `Copyright © ${new Date().getFullYear()} Joël Gähwiler. All rights reserved.`,
    executableName: 'remotiot-bridge',
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
        name: 'remotiot-bridge',
        exe: 'remotiot-bridge.exe',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          name: 'remotiot-bridge',
          bin: 'remotiot-bridge',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          name: 'remotiot-bridge',
          bin: 'remotiot-bridge',
        },
      },
    },
  ],
  hooks: {
    postMake: async (_, results) => {
      /* consistently name artifacts */

      // prepare rules
      const rules = [
        { test: /.*\.zip/, name: `remotiot-bridge-${pkg.version}-${process.platform}.zip` },
        { test: /.*\.dmg/, name: `remotiot-bridge-${pkg.version}.dmg` },
        { test: /.*\.exe/, name: `remotiot-bridge-${pkg.version}.exe` },
        { test: /.*\.deb/, name: `remotiot-bridge-${pkg.version}.deb` },
        { test: /.*\.rpm/, name: `remotiot-bridge-${pkg.version}.rpm` },
        { test: /.*-full\.nupkg/, name: `remotiot-bridge-${pkg.version}-full.nupkg` },
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
