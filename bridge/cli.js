const { start, stop } = require('./src/bridge');

start('mqtt://garage:testtest@garage.cloud.shiftr.io');

process.on('SIGINT', async () => {
  await stop();
  process.exit(0);
});
