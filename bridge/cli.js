const { start, stop } = require('./src/bridge');

start('mqtt://remotiot:remotiot@remotiot.cloud.shiftr.io');

process.on('SIGINT', async () => {
  await stop();
  process.exit(0);
});
