// get element
const brokerInput = document.getElementById('broker');
const startButton = document.getElementById('start');
const logTextarea = document.getElementById('log');

startButton.onclick = async function () {
  // send start
  window.ipcRendrer.send('start', {
    broker: brokerInput.textContent,
  });

  // disable input and button
  brokerInput.disabled = true;
  startButton.disabled = true;
};

window.ipcRendrer.on('log', (_, msg) => {
  // append message
  logTextarea.textContent += `${msg}\n`;
});
