/**
* Remotiot blocks
*/
//% weight=100 color=#0fbc11 icon=""
namespace remotiot {
    let NAME: string;
    let INIT: boolean;
    let ONLINE: () => void;
    let MESSAGE: (name: string, msg: string) => void;
    let OFFLINE: () => void;
    let CONNECTED = false;

    function init() {
        // check flag
        if (INIT) {
            return;
        }

        // set flag
        INIT = true;

        // register data handler
        bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            // read line
            let name = bluetooth.uartReadUntil(";");
            let to = bluetooth.uartReadUntil(";");
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

            // check name
            if (to !== NAME) {
                return;
            }

            // yield message
            MESSAGE(name, msg);
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
        if (CONNECTED) {
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
    * @param msg the message, eg: "hello!"
    */
    //%block="send message $msg to $name"
    //%block.loc.de="schicke nachricht $msg an $name"
    //%weight=80
    export function send(name: string, msg: string): void {
        // init
        init();

        // write message
        bluetooth.uartWriteLine(`${NAME};${name};${msg}`);
    }

    /**
     * The callback called when a message has been received.
     */
    //%block="on message $msg received from $name"
    //%block.loc.de="wenn nachricht $msg empfangen von $name"
    //%draggableParameters
    //%weight=70
    export function onMessage(handler: (name: string, msg: string) => void): void {
        // init
        init();

        // set handler
        MESSAGE = handler;
    }
}
