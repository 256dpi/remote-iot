const path = require('path');
const mqtt = require('mqtt');
const noble = require('@abandonware/noble');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

const uartUUID = '6e400001b5a3f393e0a9e50e24dcca9e';
const txUUID = '6e400002b5a3f393e0a9e50e24dcca9e';
const rxUUID = '6e400003b5a3f393e0a9e50e24dcca9e';

let discoverHandler;

// handle state changes
noble.on('stateChange', async function (state) {
  if (state === 'poweredOn') {
    await noble.startScanningAsync([], true);
  } else {
    await noble.stopScanningAsync();
  }
});

// handle discovered devices
noble.on('discover', async function (peripheral) {
  if (discoverHandler) {
    discoverHandler(peripheral);
  }
});

let portHandler;

// handle discovered ports
setInterval(async () => {
  if (portHandler) {
    const ports = await SerialPort.list();
    for (const port of ports) {
      portHandler(port);
    }
  }
}, 2000);

let started = false;
let client;
let bleDevices = {};
let spDevices = {};

module.exports.start = async function (uri, clientID = 'RemotIoT', logger = console.log) {
  // check started
  if (started) {
    return;
  }

  // set flag
  started = true;

  // log
  logger('==> Starting...');

  // prepare client
  client = mqtt.connect(uri, {
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
    for (const device of Object.values(bleDevices)) {
      if (device.filter === topic) {
        device.rxChar.write(buf, true);
      }
    }

    // relay message
    for (const device of Object.values(spDevices)) {
      if (device.filter === topic) {
        device.port.write(buf);
      }
    }
  });

  // handle discovered devices
  discoverHandler = async function (peripheral) {
    // get name
    const name = peripheral.advertisement.localName || '';

    // check name
    if (!name.includes('Calliope')) {
      return;
    }

    // check device
    if (bleDevices[peripheral.id]) {
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
    };

    // store device
    bleDevices[peripheral.id] = device;

    // define cleanup
    const cleanup = async () => {
      // disconnect if connected
      if (device.connected) {
        await peripheral.disconnectAsync();
        device.connected = false;
      }

      // delete device
      delete bleDevices[peripheral.id];
    };

    // log
    logger('==> Device found: ' + name);

    // set flag
    device.connected = true;

    // connect
    await peripheral.connectAsync();

    // handle errors
    peripheral.on('error', (err) => {
      logger('==> Error: ' + err.toString());
    })

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

    // handle messages
    txChar.on('data', (data) => {
      // get message
      const msg = data.toString().trim();

      // check message
      if (msg.length === 0) {
        return;
      }

      // check config
      if (msg.startsWith('$config;')) {
        // get filter
        device.filter = msg.slice(8);

        // log
        logger('==> Got config: ' + device.filter);

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

    // subscribe messages
    await txChar.subscribeAsync();

    // write ready
    await rxChar.writeAsync(Buffer.from('$ready;;\n', 'utf8'), true);

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
  };

  // handle discovered ports
  portHandler = async function (info) {
    // {
    //   path: '/dev/tty.usbmodem0008888788511',
    //   manufacturer: 'SEGGER',
    //   serialNumber: '000888878851',
    //   pnpId: undefined,
    //   locationId: '14130000',
    //   vendorId: '1366',
    //   productId: '1025'
    // }

    // check vendor and product id
    if (info.vendorId !== '1366' || info.productId !== '1025') {
      return;
    }

    // check device
    if (spDevices[info.path]) {
      return;
    }

    // get name
    const name = path.basename(info.path);

    // prepare device
    const device = {
      path: name,
      info: info,
      filter: '',
      opened: false,
    };

    // store device
    spDevices[info.path] = device;

    // define cleanup
    const cleanup = async () => {
      // close if opened
      if (device.opened) {
        await device.port.close();
        device.opened = false;
      }

      // delete device
      delete spDevices[info.path];
    };

    // log
    logger('==> Device found: ' + name);

    // open port
    const port = new SerialPort(info.path, { baudRate: 115200 });

    // set port and flag
    device.port = port;
    device.opened = true;

    // handle errors
    port.on('error', (err) => {
      logger('==> Error: ' + err.toString());
    })

    // prepare parser
    const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

    // handle messages
    parser.on('data', (data) => {
      // get message
      const msg = data.toString().trim();

      // check message
      if (msg.length === 0) {
        return;
      }

      // check config
      if (msg.startsWith('$config;')) {
        // get filter
        device.filter = msg.slice(8);

        // log
        logger('==> Got config: ' + device.filter);

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

    // write ready
    await port.write('$ready;;\n');

    // log
    logger('==> Device opened: ' + name);

    // handle close
    port.once('close', async () => {
      // set flag
      device.opened = false;

      // disconnect
      await cleanup();

      // log
      logger('==> Device closed: ' + name);
    });
  };
};

module.exports.stop = async function (logger = console.log) {
  // check flag
  if (!started) {
    return;
  }

  // set flag
  started = false;

  // log
  logger('==> Stopping...');

  // unset handlers
  discoverHandler = null;
  portHandler = null;

  // disconnect
  client.end(true);

  // disconnect bluetooth devices
  for (const device of Object.values(bleDevices)) {
    if (device.connected) {
      await device.peripheral.disconnectAsync();
    }
  }

  // close serial ports
  for (const device of Object.values(spDevices)) {
    if (device.opened) {
      await device.port.write('$close;;\n');
      await device.port.close();
    }
  }

  // reset lists
  bleDevices = {};
  spDevices = {};

  // log
  logger('==> Stopped!');
};
