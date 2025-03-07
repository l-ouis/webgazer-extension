const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
const OFFSCREEN_REASON = 'USER_MEDIA';

chrome.runtime.onInstalled.addListener(handleInstall);

chrome.runtime.onMessage.addListener((request) => {
  switch (request.message.type) {
    case 'TOGGLE_WEBGAZER':
      switch (request.message.data) {
        case 'START':
          initateRecordingStart();
          break;
        case 'STOP':
          initateRecordingStop();
          break;
      }
      break;
  }
});

async function handleInstall() {
  console.log('extension installed');
  if (!(await hasDocument())) {
    await createOffscreenDocument();
  }
}

async function sendMessageToOffscreenDocument(type, data) {
  try {
    if (!(await hasDocument())) {
      await createOffscreenDocument();
    }
  } finally {
    chrome.runtime.sendMessage({
      message: {
        type: type,
        target: 'offscreen',
        data: data
      }
    });
  }
}

function initateRecordingStop() {
  console.log('Webgazer stopped at offscreen');
  sendMessageToOffscreenDocument('STOP_WEBGAZER');
}

function initateRecordingStart() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
    if (chrome.runtime.lastError || !tab) {
      console.error('No valid webpage or tab opened');
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        message: { type: 'PROMPT_CAMERA_PERMISSION' }
      },
      (response) => {
        if (response.message.status === 'success') {
          console.log('WebGazer started at offscreen');
          sendMessageToOffscreenDocument('START_WEBGAZER');
        }
      }
    );
  });
}

/**
 * Checks if there is an offscreen document.
 * @returns {Promise<boolean>} - Promise that resolves to a boolean indicating if an offscreen document exists.
 */
async function hasDocument() {
  // Check all windows controlled by the service worker if one of them is the offscreen document
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
      return true;
    }
  }
  return false;
}

/**
 * Creates the offscreen document.
 * @returns {Promise<void>} - Promise that resolves when the offscreen document is created.
 */
async function createOffscreenDocument() {
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [OFFSCREEN_REASON],
    justification: 'To interact with user media'
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GAZE_PREDICTION") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "GAZE_PREDICTION", prediction: message.prediction });
      }
    });
  }
});