remote_iot.onOnline(function () {
    basic.setLedColor(0x00ff00)
})
input.onButtonPressed(Button.A, function () {
    remote_iot.send("peter", "hello!")
})
input.onGesture(Gesture.TiltLeft, function () {
    remote_iot.send("lisa", "bang!")
})
input.onGesture(Gesture.TiltRight, function () {
    remote_iot.start("peter");
})
remote_iot.onOffline(function () {
    basic.setLedColor(0xff0000)
})
remote_iot.onMessage(function (name, msg) {
    basic.showNumber(msg.length)
    if (msg == "bang!") {
        music.playTone(262, music.beat(BeatFraction.Whole))
    } else {
        basic.showString(msg)
    }
})
input.onButtonPressed(Button.B, function () {
    remote_iot.send("lisa", "cool!")
})
basic.setLedColor(0xff0000)
remote_iot.start("lisa")
