document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('start-button');
  const stopButton = document.getElementById('stop-button');
  const startFogButton = document.getElementById('start-fog-button');
  const stopFogButton = document.getElementById('stop-fog-button');

  const sendMessageToBackground = (type, data) => {
    chrome.runtime.sendMessage({
      message: {
        type: type,
        target: 'background',
        data: data
      }
    });
  };

  startButton.addEventListener('click', function () {
    sendMessageToBackground('TOGGLE_WEBGAZER', 'START');
  });

  stopButton.addEventListener('click', function () {
    sendMessageToBackground('TOGGLE_WEBGAZER', 'STOP');
  });

  startFogButton.addEventListener('click', function () {
    sendMessageToBackground('TOGGLE_FOG', 'START');
  });

  stopFogButton.addEventListener('click', function () {
    sendMessageToBackground('TOGGLE_FOG', 'STOP');
  });
});