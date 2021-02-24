const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

const path = require('path');
const url = require('url');

const { start, stop } = require('./bridge');

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src', 'preload.js'),
    },
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  await mainWindow.loadURL(
    url.format({
      pathname: path.join(app.getAppPath(), 'src', 'index.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async function () {
  if (mainWindow === null) {
    createWindow().then();
  }
});

function logger(msg) {
  // log message
  console.log(msg);

  // forward message
  if (mainWindow) {
    mainWindow.webContents.send('log', msg);
  }
}

ipcMain.on('start', (_, opts) => {
  // get broker
  const broker = opts.broker || 'mqtt://remote-iot:remote-iot@remote-iot.cloud.shiftr.io';

  // run bridge
  start(broker, 'Remote-IoT', logger);
});

ipcMain.on('stop', async () => {
  await stop(logger);
});
