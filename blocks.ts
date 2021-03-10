/**
* Remote IoT blocks
*/
//% weight=100 color=#0fbc11 icon="" block="Remote IoT"
namespace remote_iot {
    let NAME: string;
    let INIT: boolean;
    let SERIAL: boolean;
    let ONLINE: () => void;
    let MESSAGE: (name: string, id: string, msg: string) => void;
    let OFFLINE: () => void;
    let CONNECTED = false;

    function init() {
        // check flag
        if (INIT) {
            return;
        }

        // set flag
        INIT = true;

        // set baud rate
        serial.setBaudRate(115200);

        // register serial receive handler
        serial.onDataReceived(serial.delimiters(Delimiters.NewLine), () => {
            // read line
            let name = serial.readUntil(";");
            let to = serial.readUntil(";");
            let id = serial.readUntil(";");
            let msg = serial.readUntil("\n");

            // handle ready
            if (name === "$ready") {
                // send configuration
                serial.writeLine(`$config;${NAME}`);

                // call handler if available
                if(ONLINE) {
                    ONLINE();
                }

                // set flag
                SERIAL = true;

                return;
            }

            // handle close
            if (name == "$close") {
                // call handle if available
                if(OFFLINE) {
                    OFFLINE();
                }

                // set flag
                SERIAL = false;

                return;
            }

            // check flag and name
            if (!SERIAL || to !== NAME) {
                return;
            }

            // yield message
            MESSAGE(name, id, msg);
        });

        // register bluetooth data handler
        bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine),() => {
            // read line
            let name = bluetooth.uartReadUntil(";");
            let to = bluetooth.uartReadUntil(";");
            let id = bluetooth.uartReadUntil(';');
            let msg = bluetooth.uartReadUntil("\n");

            // check name
            if (name === "$ready") {
                // send configuration
                bluetooth.uartWriteLine(`$config;${NAME}`);

                // call handler if available
                if(ONLINE) {
                    ONLINE();
                }

                // set flag
                CONNECTED = true;

                return;
            }

            // check flag and name
            if (!CONNECTED || to !== NAME) {
                return;
            }

            // yield message
            MESSAGE(name, id, msg);
        });

        // register offline handler
        bluetooth.onBluetoothDisconnected(() => {
            // set flag
            CONNECTED = false;

            // call handler if available
            if (OFFLINE) {
                OFFLINE();
            }
        });
    }

    /**
     * Initialize the system.
     * @param name your name, eg: "lisa"
     */
    //%block="initialize with name $name"
    //%block.loc.de="initialisieren mit name $name"
    //%weight=100
    export function start(name: string): void {
        // init
        init();

        // store name
        NAME = name;

        // update config
        if (SERIAL || CONNECTED) {
            bluetooth.uartWriteLine(`$config;${NAME}`);
        }
    }

    /**
     * The callback called when online.
     */
    //%block="on online"
    //%block.loc.de="wenn online"
    //%weight=60
    export function onOnline(handler: () => void): void {
        // init
        init();

        // store handler
        ONLINE = handler;
    }

    /**
     * The callback called when offline.
     */
    //%block="on offline"
    //%block.loc.de="wenn offline"
    export function onOffline(handler: () => void): void {
        // init
        init();

        // store handler
        OFFLINE = handler;
    }

    /**
    * Send a message to a peer.
    * @param name the recipient, eg: "peter"
    * @param id the identifier, eg: "txt"
    * @param msg the message, eg: "hello!"
    */
    //%block="send message $tex with $id to $name"
    //%block.loc.de="schicke nachricht $text mit $id an $name"
    //%weight=80
    export function send(name: string, id: string, msg: string): void {
        // init
        init();

        // write message
        if (SERIAL) {
            serial.writeLine(`${NAME};${name};${id};${msg}`);
        } else if(CONNECTED) {
            bluetooth.uartWriteLine(`${NAME};${name};${id};${msg}`);
        }
    }

    /**
     * The callback called when a message has been received.
     */
    //%block="on message $text with $id received from $name"
    //%block.loc.de="wenn nachricht $text mit $id empfangen von $name"
    //%draggableParameters
    //%weight=70
    export function onMessage(handler: (name: string, id: string, msg: string) => void): void {
        // init
        init();

        // set handler
        MESSAGE = handler;
    }
}
