remote_iot.onOnline(function () {
    basic.setLedColor(0x00ff00)
})
input.onButtonPressed(Button.A, function () {
    remote_iot.send("peter", "txt", "hello!")
})
input.onButtonPressed(Button.B, function () {
    remote_iot.send("lisa", "txt", "cool!")
})
remote_iot.onOffline(function () {
    basic.setLedColor(0x0000ff)
})
remote_iot.onMessage(function (name, id, text) {
    basic.showNumber(name.length)
    basic.showString(name)
    basic.showNumber(id.length)
    basic.showString(id)
    basic.showNumber(text.length)
    basic.showString(text)
})
basic.setLedColor(0xff0000)
remote_iot.start("lisa")
