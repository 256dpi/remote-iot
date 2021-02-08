const mqtt = require('mqtt');
const noble = require('@abandonware/noble');

const uartUUID = '6e400001b5a3f393e0a9e50e24dcca9e';
const txUUID = '6e400002b5a3f393e0a9e50e24dcca9e';
const rxUUID = '6e400003b5a3f393e0a9e50e24dcca9e';

let scanning = false;
const devices = {};

module.exports.start = function (uri, clientID = 'Remotiot', logger = console.log) {
  // prepare client
  const client = mqtt.connect(uri, {
    clientId: clientID,
  });

  // handle connected
  client.on('connect', () => {
    logger('==> MQTT connected!');
  });

  // handle error
  client.on('error', (err) => {
    logger('==> MQTT error: ' + err.toString());
  });

  // subscribe
  client.subscribe('#');

  // handle messages
  client.on('message', (topic, data) => {
    // get message
    const msg = data.toString();

    // log
    logger('==> Incoming message: ' + msg);

    // make buffer
    const buf = Buffer.from(msg + '\n', 'utf8');

    // relay message
    for (const device of Object.values(devices)) {
      if (device.filter === topic) {
        device.rxChar.write(buf, true);
      }
    }
  });

  // handle state changes
  noble.on('stateChange', async function (state) {
    if (state === 'poweredOn') {
      logger('==> Started scanning...');
      await noble.startScanningAsync([], true);
      scanning = true;
    } else {
      logger('==> Stopped scanning...');
      await noble.stopScanningAsync();
      scanning = false;
    }
  });

  // handle discovered devices
  noble.on('discover', async function (peripheral) {
    // get name
    const name = peripheral.advertisement.localName || '';

    // check name
    if (!name.includes('Calliope')) {
      return;
    }

    // check device
    if (devices[peripheral.id]) {
      return;
    }

    // prepare device
    const device = {
      name: name,
      peripheral: peripheral,
      txChar: null,
      rxChar: null,
      filter: '',
      connected: false,
      read: false,
    };

    // store device
    devices[peripheral.id] = device;

    // define cleanup
    const cleanup = async () => {
      // disconnect if connected
      if (device.connected) {
        await peripheral.disconnectAsync();
        device.connected = false;
      }

      // delete device
      delete devices[peripheral.id];
    };

    // log
    logger('==> Device found: ' + name);

    // connect
    await peripheral.connectAsync();

    // set flag
    device.connected = true;

    // discover all services and characteristics
    await peripheral.discoverAllServicesAndCharacteristicsAsync();

    // find UART service
    const uartService = peripheral.services.find((svc) => svc.uuid === uartUUID);
    if (!uartService) {
      logger('==> UART service not found: ' + name);
      await cleanup();
      return;
    }

    // find characteristics
    const txChar = uartService.characteristics.find((chr) => chr.uuid === txUUID);
    const rxChar = uartService.characteristics.find((chr) => chr.uuid === rxUUID);
    if (!txChar || !rxChar) {
      logger('==> UART characteristics not found: ' + name);
      await cleanup();
      return;
    }

    // update device
    device.txChar = txChar;
    device.rxChar = rxChar;

    // subscribe messages
    await txChar.subscribeAsync();

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
      logger('==> Outgoing message: ' + msg);

      // parse message
      const segments = msg.split(';');
      if (segments.length !== 3) {
        return;
      }

      // publish message
      client.publish(segments[1], msg);
    });

    // log
    logger('==> Device connected: ' + name);

    // handle disconnect
    peripheral.once('disconnect', async () => {
      // set flag
      device.connected = false;

      // disconnect
      await cleanup();

      // log
      logger('==> Device disconnected: ' + name);
    });
  });
};

module.exports.stop = async function () {
  // log
  console.log("==> Stopping...");

  // stop scanning
  if (scanning) {
    await noble.stopScanningAsync();
  }

  // disconnect connections
  for (const device of Object.values(devices)) {
    if (device.connected) {
      await device.peripheral.disconnectAsync();
    }
  }
};
