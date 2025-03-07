

// Handle camera permission with iframe
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.message.type) {
    case 'PROMPT_CAMERA_PERMISSION':
      checkCameraPermissions()
        .then(() => {
          sendResponse({ message: { status: 'success' } });
        })
        .catch(() => {
          promptCameraPermissions();
          const iframe = document.getElementById('PERMISSION_IFRAME_ID');
          window.addEventListener('message', (event) => {
            if (event.source === iframe.contentWindow && event.data) {
              if (event.data.type === 'permissionsGranted') {
                sendResponse({
                  message: { status: 'success' }
                });
              } else {
                sendResponse({
                  message: {
                    status: 'failure'
                  }
                });
              }
              document.body.removeChild(iframe);
            }
          });
        });
      break;

    default:
      // Do nothing for other message types
      break;
  }
  return true;
});

function checkCameraPermissions() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        message: {
          type: 'CHECK_PERMISSIONS',
          target: 'offscreen'
        }
      },
      (response) => {
        if (response.message.status === 'success') {
          resolve();
        } else {
          reject(response.message.data);
        }
      }
    );
  });
}


function promptCameraPermissions() {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('hidden', 'hidden');
  iframe.setAttribute('allow', 'camera');
  iframe.setAttribute('id', 'PERMISSION_IFRAME_ID');
  iframe.src = chrome.runtime.getURL('requestPermissions.html');
  document.body.appendChild(iframe);
}


// send mouse data from current pages to background.js
document.addEventListener('mousemove', (event) => {
  const mouseData = {
    type: 'MOUSE_MOVE',
    clientX: event.clientX,
    clientY: event.clientY
  };
  chrome.runtime.sendMessage({ message: mouseData });
});

document.addEventListener('click', (event) => {
  const clickData = {
    type: 'MOUSE_CLICK',
    clientX: event.clientX,
    clientY: event.clientY
  };
  chrome.runtime.sendMessage({ message: clickData });
});

// Update viewport changes every so often to bound gaze prediction
setInterval(() => {
  const viewportData = {
    type: 'VIEWPORT_SIZE',
    width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  };
  chrome.runtime.sendMessage({ message: viewportData });
}, 2000);



// maps current text elements and highlights those that are gazed
// (demo / test code)
const visibleTextElements = new Map();
const gazedTextElements = new Map();

function updateVisibleTextElements() {
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
  elements.forEach((element) => {
    if (element.offsetParent !== null) {
      const uniqueId = generateUniqueId(element.innerText);
      visibleTextElements.set(uniqueId, element);
      gazedTextElements.set(uniqueId, 0);
    }
  });
}

function updateGazedVisibleTextElement(xPos, yPos) {
  const offsetX = window.scrollX || document.documentElement.scrollLeft;
  const offsetY = window.scrollY || document.documentElement.scrollTop;
  const adjustedX = xPos + offsetX;
  const adjustedY = yPos + offsetY;

  visibleTextElements.forEach((element, uniqueId) => {
    const rect = element.getBoundingClientRect();
    const elementX = rect.left + offsetX;
    const elementY = rect.top + offsetY;
    const elementWidth = rect.width;
    const elementHeight = rect.height;

    if (
      adjustedX >= elementX &&
      adjustedX <= elementX + elementWidth &&
      adjustedY >= elementY &&
      adjustedY <= elementY + elementHeight
    ) {
      gazedTextElements.set(uniqueId, gazedTextElements.get(uniqueId) + 1);
      element.style.backgroundColor = 'yellow';
      if (gazedTextElements.get(uniqueId) > 3) {
        
      }
    }
  });
}

function generateUniqueId(text) {
  return 'id-' + btoa(encodeURIComponent(text)).substring(0, 9);
}

updateVisibleTextElements();
window.addEventListener('resize', updateVisibleTextElements);
window.addEventListener('scroll', updateVisibleTextElements);


// handle gaze dot
const gazeDot = document.createElement('div');

gazeDot.style.position = 'absolute';
gazeDot.style.width = '10px';
gazeDot.style.height = '10px';
gazeDot.style.zIndex = 99999;
gazeDot.style.backgroundColor = 'red';
gazeDot.style.pointerEvents = 'none';
gazeDot.style.left = '-5px';
gazeDot.style.top  = '-5px';
document.body.appendChild(gazeDot);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GAZE_PREDICTION') {
    const pred = message.prediction;
    const boundedX = Math.max(0, Math.min(pred.x, window.innerWidth - gazeDot.offsetWidth));
    const boundedY = Math.max(0, Math.min(pred.y, window.innerHeight - gazeDot.offsetHeight));
    updateGazedVisibleTextElement(boundedX, boundedY);
    gazeDot.style.transform = 'translate3d(' + pred.x + 'px,' + pred.y + 'px,0)';
    const offsetX = window.scrollX || document.documentElement.scrollLeft;
    const offsetY = window.scrollY || document.documentElement.scrollTop;
    gazeDot.style.transform = 'translate3d(' + (boundedX + offsetX) + 'px,' + (boundedY + offsetY) + 'px,0)';

  }
  return true;
});

