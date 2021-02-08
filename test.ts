remotiot.onOnline(function () {
    basic.setLedColor(0x00ff00)
})
input.onButtonPressed(Button.A, function () {
    remotiot.send("peter", "hello!")
})
input.onGesture(Gesture.TiltLeft, function () {
    remotiot.send("lisa", "bang!")
})
remotiot.onOffline(function () {
    basic.setLedColor(0xff0000)
})
remotiot.onMessage(function (name, msg) {
    basic.showNumber(msg.length)
    if (msg == "bang!") {
        music.playTone(262, music.beat(BeatFraction.Whole))
    } else {
        basic.showString(msg)
    }
})
input.onButtonPressed(Button.B, function () {
    remotiot.send("lisa", "cool!")
})
basic.setLedColor(0xff0000)
remotiot.start("lisa")
