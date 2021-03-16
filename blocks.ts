/**
* Remote IoT blocks
*/
//% weight=100 color=#0fbc11 icon="" block="Remote IoT"
namespace remote_iot {
    let NAME: string;
    let INIT: boolean;
    let SERIAL: boolean;
    let ONLINE: () => void;
    let MESSAGE: (name: string, id: string, text: string) => void;
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
            let text = serial.readUntil("\n");

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
            MESSAGE(name, id, text);
        });

        // register bluetooth data handler
        bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine),() => {
            // read line
            let name = bluetooth.uartReadUntil(";");
            let to = bluetooth.uartReadUntil(";");
            let id = bluetooth.uartReadUntil(';');
            let text = bluetooth.uartReadUntil("\n");

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
            MESSAGE(name, id, text);
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
    //%block.loc.de="initialisieren mit Name $name"
    //%weight=100
    export function start(name: string): void {
        // init
        init();

        // store name
        NAME = name;

        // update config
        if (SERIAL) {
            serial.writeLine(`$config;${NAME}`);
        } else if (CONNECTED) {
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
    * @param id the identifier, eg: "msg"
    * @param text the message, eg: "hello!"
    */
    //%block="send message $text with identifier $id to recipient $name"
    //%block.loc.de="schicke Nachricht $text mit der Kennung $id an den Empfänger $name"
    //%weight=80
    export function send(name: string, id: string, text: string): void {
        // init
        init();

        // write message
        if (SERIAL) {
            serial.writeLine(`${NAME};${name};${id};${text}`);
        } else if(CONNECTED) {
            bluetooth.uartWriteLine(`${NAME};${name};${id};${text}`);
        }
    }

    /**
     * The callback called when a message has been received.
     */
    //%block="on message $text with identifier $id received from sender $name"
    //%block.loc.de="wenn Nachricht $text mit Kennung $id empfangen von Absender $name"
    //%draggableParameters
    //%weight=70
    export function onMessage(handler: (name: string, id: string, text: string) => void): void {
        // init
        init();

        // set handler
        MESSAGE = handler;
    }
}
