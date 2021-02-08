/**
* Remotiot blocks
*/
//% weight=100 color=#0fbc11 icon=""
namespace remotiot {
    let NAME: string;
    let CONFIG: boolean;
    let ONLINE: () => void;

    /**
     * Initialize the system.
     * @param name your name, eg: "lisa"
     */
    //%block="initialize with name $name"
    //%block.loc.de="initialisieren mit name $name"
    //%weight=100
    export function start(name: string): void {
        // store name
        NAME = name;

        // check config
        if (CONFIG) {
            return;
        }

        // set flag
        CONFIG = true;

        // register handler
        bluetooth.onBluetoothConnected(() => {
            // wait for bluetooth
            basic.pause(1000);

            // send configuration
            bluetooth.uartWriteLine(`$config:${NAME}`);

            // call handler if available
            if(ONLINE) {
                ONLINE();
            }
        });
    }

    /**
     * The callback called when online.
     */
    //%block="on online"
    //%block.loc.de="wenn online"
    //%weight=60
    export function onOnline(handler: () => void): void {
        // store handler
        ONLINE = handler;
    }

    /**
     * The callback called when offline.
     */
    //%block="on offline"
    //%block.loc.de="wenn offline"
    export function onOffline(handler: () => void): void {
        // forward callback
        bluetooth.onBluetoothDisconnected(handler);
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
    export function onMessage(body: (name: string, msg: string) => void): void {
        // receive data line by line
        bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
            // read line
            let name = bluetooth.uartReadUntil(";");
            let to = bluetooth.uartReadUntil(";");
            let msg = bluetooth.uartReadUntil("\n");

            // check name
            if (to !== NAME) {
                return;
            }

            // yield message
            body(name, msg);
        })
    }
}
