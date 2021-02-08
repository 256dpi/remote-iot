const mqtt = require('mqtt');
const noble = require('@abandonware/noble');

const uartUUID = '6e400001b5a3f393e0a9e50e24dcca9e';
const txUUID = '6e400002b5a3f393e0a9e50e24dcca9e';
const rxUUID = '6e400003b5a3f393e0a9e50e24dcca9e';

const connections = {};
const devices = {};

module.exports.start = function(uri, clientID = 'Remotiot', logger = console.log) {
  const client = mqtt.connect(uri, {
    clientId: clientID
  });

  client.on('connect', () => {
    logger("==> MQTT connected!");
  });

  client.on('error', (err) => {
    logger("==> MQTT error: " + err.toString());
  });

  client.subscribe('#');

  client.on('message', (topic, data) => {
    // get message
    const msg = data.toString()

    // log
    logger("==> Incoming message: " + msg)

    // make buffer
    const buf = Buffer.from(msg + "\n", 'utf8');

    // relay message
    for (const device of Object.values(devices)) {
      if (device.filter === topic) {
        device.rxChar.write(buf, true);
      }
    }
  });

  noble.on('stateChange', async function (state) {
    if (state === 'poweredOn') {
      logger('==> Started scanning...');
      await noble.startScanningAsync([], true);
    } else {
      logger('==> Stopped scanning...');
      await noble.stopScanningAsync();
    }
  });

  noble.on('discover', async function (peripheral) {
    // get name
    const name = peripheral.advertisement.localName || '';

    // check name
    if (!name.includes('Calliope')) {
      return;
    }

    // check connections
    if (connections[peripheral.id]) {
      return;
    }

    // store connection
    connections[peripheral.id] = peripheral;

    // define cleanup
    let connected = false;
    const disconnect = async () => {
      if (connected) {
        await peripheral.disconnectAsync()
      }

      // delete connection
      delete connections[peripheral.id];

      // delete device
      delete devices[peripheral.id];
    }

    // log
    logger("==> Device found: " + name);

    // connect
    await peripheral.connectAsync();

    // discover all services and characteristics
    await peripheral.discoverAllServicesAndCharacteristicsAsync();

    // find UART service
    const uartService = peripheral.services.find(svc => svc.uuid === uartUUID);
    if (!uartService) {
      logger("==> UART service not found: " + name);
      await disconnect()
      return;
    }

    // find characteristics
    const txChar = uartService.characteristics.find(chr => chr.uuid === txUUID);
    const rxChar = uartService.characteristics.find(chr => chr.uuid === rxUUID);
    if (!txChar || !rxChar) {
      logger("==> UART characteristics not found: " + name);
      await disconnect()
      return;
    }

    // subscribe messages
    await txChar.subscribeAsync();

    // prepare device
    const device = {
      name: name,
      peripheral: peripheral,
      txChar: txChar,
      rxChar: rxChar,
      filter: ''
    }

    // handle messages
    txChar.on('data', (data) => {
      // get message
      const msg = data.toString().trim();

      // check config
      if (msg.startsWith('$config:')) {
        // get filter
        device.filter = msg.slice(8);

        // log
        logger('==> Got filter: ' + device.filter);

        return;
      }

      // log
      logger('==> Outgoing message: ' +  msg);

      // parse message
      const segments = msg.split(';')
      if (segments.length !== 3) {
        return;
      }

      // publish message
      client.publish(segments[1], msg);
    });

    // log
    logger("==> Device connected: " + name);

    // store device
    devices[peripheral.id] = device;

    // handle disconnect
    peripheral.once('disconnect', async () => {
      // disconnect
      await disconnect()

      // log
      logger("==> Device disconnected: " + name);
    });
  });
}

module.exports.stop = async function () {
  // stop scanning
  await noble.stopScanningAsync()

  // disconnect connections
  for(const peripheral of Object.values(connections)) {
    await peripheral.disconnectAsync();
  }
}
