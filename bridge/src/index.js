// get element
const brokerInput = document.getElementById('broker');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const logTextarea = document.getElementById('log');

startButton.onclick = () => {
  // clear log
  logTextarea.textContent = '';

  // send start
  window.ipcRendrer.send('start', {
    broker: brokerInput.textContent,
  });

  // disable input and button
  brokerInput.disabled = true;
  startButton.disabled = true;
  stopButton.disabled = false;
};

stopButton.onclick = () => {
  // send stop
  window.ipcRendrer.send('stop');

  // disable input and button
  brokerInput.disabled = false;
  startButton.disabled = false;
  stopButton.disabled = true;
};

window.ipcRendrer.on('log', (_, msg) => {
  // append message
  logTextarea.textContent += `${msg}\n`;
});
