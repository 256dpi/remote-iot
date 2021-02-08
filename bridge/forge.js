const path = require('path');

// icon generation:
//  npx electron-icon-maker --input icon.png --output .

const config = {
  packagerConfig: {
    asar: false, // required to access CLI
    appBundleId: 'com.256dpi.remotiot-bridge',
    appCategoryType: 'public.app-category.developer-tools',
    appCopyright: `Copyright © ${new Date().getFullYear()} Joël Gähwiler. All rights reserved.`,
    executableName: 'remotiot-bridge',
    icon: path.resolve(__dirname, 'assets', 'icon'), // .icns or .ico is added depending on platform
    ignore: [/\.gitignore/, /forge\.js/, /README\.md/, /yarn\.lock/],
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32', 'linux'],
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {
        icon: path.resolve(__dirname, 'assets', 'icon.icns'),
        background: path.resolve(__dirname, 'assets', 'dmg.png'), // also uses dmg@2x.png
      },
    },
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {
        name: 'shiftr-io-desktop',
        exe: 'shiftr-io-desktop.exe',
        iconUrl: 'https://www.shiftr.io/favicon.ico',
        setupIcon: path.resolve(__dirname, 'assets', 'icon.ico'),
      },
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        options: {
          name: 'shiftr-io-desktop',
          bin: 'shiftr-io-desktop',
          icon: path.resolve(__dirname, 'assets', 'icon.png'),
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux'],
      config: {
        options: {
          name: 'shiftr-io-desktop',
          bin: 'shiftr-io-desktop',
          icon: path.resolve(__dirname, 'assets', 'icon.png'),
        },
      },
    },
  ],
};

module.exports = config;
