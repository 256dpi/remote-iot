const { start, stop } = require('./src/bridge');

start('mqtt://remote-iot:remote-iot@remote-iot.cloud.shiftr.io');

process.on('SIGINT', async () => {
  await stop();
  process.exit(0);
});
