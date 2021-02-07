/**
* Remotiot blocks
*/
//% weight=100 color=#0fbc11 icon=""
namespace remotiot {
    let NAME: string;
    let CONFIG: boolean;
    let ONLINE: () => void;

    /**
     * Start...
     * @param name your name, eg: "lisa"
     */
    //%block="start with name $name"
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
     * Online...
     */
    //%block="on online"
    export function onOnline(handler: () => void): void {
        // store handler
        ONLINE = handler;
    }

    /**
     * Offline...
     */
    //%block="on offline"
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
    export function send(name: string, msg: string): void {
        // write message
        bluetooth.uartWriteLine(`${NAME};${name};${msg}`);
    }

    /**
     * Message...
     */
    //%block="on message $msg from $name"
    //% draggableParameters
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
