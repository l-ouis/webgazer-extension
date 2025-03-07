import webgazer from './webgazer/index.mjs';

/**
 * Event listener for messages from the extension.
 * @param {Object} request - The message request.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - Callback function to send a response.
 * @returns {boolean} - Indicates whether the response should be asynchronous.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message.target !== 'offscreen') {
    return;
  }

  switch (request.message.type) {
    case 'START_WEBGAZER':
      // Start recording
      handleStartWebgazer();
      sendResponse({});
      break;
    case 'STOP_WEBGAZER':
      // Stop recording
      stopWebgazer();
      sendResponse({});
      break;
    case 'CHECK_PERMISSIONS': // todo: delete this
      checkAudioPermissions()
        .then((data) => sendResponse(data))
        .catch((errorData) => sendResponse(errorData));
      break;
    default:
      break;
  }

  return true;
});

/**
 * Stops the recording if the MediaRecorder is in the recording state.
 */
function stopWebgazer() {
  webgazer.pause();
}

/**
 * Initiates the audio recording process using MediaRecorder.
 */
function handleStartWebgazer() {

  let videoStream = null;
  navigator.mediaDevices.getUserMedia({ audio: false, video: { width: 1280, height: 720 } })
    .then((stream) => {
      videoStream = stream
    })
    .catch((error) => {
      console.error('Error accessing media devices.', error);
    });
    console.log("Trying to start WebGazer in offscreen");
    webgazer.setGazeListener(function(data, elapsedTime) {
      if (data == null) {
        return;
      }
      var xprediction = data.x; //these x coordinates are relative to the viewport
      var yprediction = data.y; //these y coordinates are relative to the viewport
      // Sent to background
      chrome.runtime.sendMessage({ type: "GAZE_PREDICTION",
                                    prediction: {x: xprediction, y: yprediction} });
      console.log(xprediction, yprediction); //elapsed time is based on time since begin was called
    }).begin(videoStream);
}


/**
 * Checks microphone permissions using the `navigator.permissions.query` API.
 * @returns {Promise<Object>} - Promise that resolves to an object containing permission status.
 */
function checkAudioPermissions() {
  return new Promise((resolve, reject) => {
    navigator.permissions
      .query({ name: 'microphone' })
      .then((result) => {
        if (result.state === 'granted') {
          console.log('Mic permissions granted');
          resolve({ message: { status: 'success' } });
        } else {
          console.log('Mic permissions missing', result.state);
          reject({
            message: { status: 'error', data: result.state }
          });
        }
      })
      .catch((error) => {
        console.warn('Permissions error', error);
        reject({
          message: { status: 'error', data: { error: error } }
        });
      });
  });
}