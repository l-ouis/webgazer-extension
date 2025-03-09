// ======================
// 1. CAMERA PERMISSION HANDLING
// ======================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message.type === 'PROMPT_CAMERA_PERMISSION') {
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
              sendResponse({ message: { status: 'success' } });
            } else {
              sendResponse({ message: { status: 'failure' } });
            }
            document.body.removeChild(iframe);
          }
        });
      });
    return true;
  }
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
        if (response && response.message && response.message.status === 'success') {
          resolve();
        } else {
          reject(response && response.message && response.message.data);
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

// ======================
// 2. USER INTERACTION CAPTURE
// ======================
// Capture mouse movement data
document.addEventListener('mousemove', (event) => {
  const mouseData = {
    type: 'MOUSE_MOVE',
    clientX: event.clientX,
    clientY: event.clientY
  };
  chrome.runtime.sendMessage({ message: mouseData });
});

// Capture click events
document.addEventListener('click', (event) => {
  const clickData = {
    type: 'MOUSE_CLICK',
    clientX: event.clientX,
    clientY: event.clientY
  };
  chrome.runtime.sendMessage({ message: clickData });
});

// Periodically update viewport size for gaze prediction boundaries
setInterval(() => {
  const viewportData = {
    type: 'VIEWPORT_SIZE',
    width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  };
  chrome.runtime.sendMessage({ message: viewportData });
}, 2000);

// ======================
// 3. GAZE TRACKING FOR TEXT ELEMENTS (Traditional approach)
// ======================
const visibleTextElements = new Map();
const gazedTextElements = new Map();

function updateVisibleTextElements() {
  const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span');
  elements.forEach((element) => {
    if (element.offsetParent !== null) { // Only consider visible elements
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
    }
  });
}

function generateUniqueId(text) {
  return 'id-' + btoa(encodeURIComponent(text)).substring(0, 9);
}

updateVisibleTextElements();
window.addEventListener('resize', updateVisibleTextElements);
window.addEventListener('scroll', updateVisibleTextElements);

// ======================
// 4. INTERSECTION & MUTATION OBSERVERS FOR ELEMENT TRACKING
// ======================
const elementMap = {};

const intersectionObserver = new IntersectionObserver(
  async (entries) => {
    for (const entry of entries) {
      const element = entry.target;
      // Validate element type and allowed tag names.
      if (
        element.nodeType !== Node.ELEMENT_NODE ||
        ["script", "style", "noscript"].includes(element.localName) ||
        !["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "img"].includes(element.localName)
      ) {
        continue;
      }
      // Remove unwanted child tags if not an image
      if (element.localName !== "img") {
        ["script", "noscript", "style"].forEach((tag) => {
          element.querySelectorAll(tag).forEach((node) => node.remove());
        });
      }

      // Compute content key
      let content;
      if (element.localName === "img") {
        // For images, use alt or src as the content key
        content = element.alt.trim() || element.src.trim();
      } else {
        // For other elements, use innerText
        content = element.innerText.trim();
        if (content.length <= 10) {
          continue;
        }
      }

      if (!content) continue; // Skip if no meaningful content

      if (entry.isIntersecting) {
        // Element is entering the viewport
        if (!elementMap[content]) {
          // Only add if it has not been added before
          if (!Object.keys(elementMap).some((key) => key.includes(content))) {
            elementMap[content] = await elementFactory(content, element);

            element.addEventListener("mouseenter", (event) => {
              const targetContent = event.target.innerText;
              if (elementMap[targetContent]) {
                elementMap[targetContent].hoverStart = Date.now();
              }
            });

            element.addEventListener("mouseleave", (event) => {
              const targetContent = event.target.innerText;
              if (elementMap[targetContent]) {
                const hoverTime = (Date.now() - elementMap[targetContent].hoverStart) / 1000;
                console.log(`Hover time: ${hoverTime} seconds`);
                elementMap[targetContent].hoverStart = 0;
                updateElementSignals(event.target, "hover", hoverTime);
              }
            });

            element.addEventListener("click", (event) => {
              const targetContent = event.target.innerText;
              if (elementMap[targetContent]) {
                console.log("Element clicked:", targetContent.substring(0, 50));
                updateElementSignals(event.target, "click");
              }
            });

            console.log("Element entering viewport for the first time:", content.substring(0, 50));
          }
        } else if (elementMap[content].start === 0) {
          // Element re-entering viewport
          elementMap[content].start = Date.now();
          elementMap[content].visible = true;
          console.log("Element re-entering viewport:", content.substring(0, 50));
        }
      } else {
        // Element leaves the viewport
        if (elementMap[content] && elementMap[content].start !== 0) {
          // Update dwell time
          updateElementSignals(
            elementMap[content].element,
            "dwell",
            (Date.now() - elementMap[content].start) / 1000
          );

          elementMap[content].start = 0;
          elementMap[content].visible = false;
        }
      }
    }
  },
  { threshold: [0] }
);

const mutationObserver = new MutationObserver((mutationsList) => {
  document.querySelectorAll('*').forEach((el) => {
    if (!el.id.startsWith("node-")) {
      intersectionObserver.observe(el);
    }
  });
});

const config = {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
};

document.addEventListener('DOMContentLoaded', () => {
  mutationObserver.observe(document.body, config);
  document.body.appendChild(gazeDot);
  document.querySelectorAll('*').forEach((el) => {
    intersectionObserver.observe(el);
  });
});

async function elementFactory(content, element) {
  const isImage = element.localName === "img";
  return {
      isImage, // or store the localName
      firstSeen: Date.now(),
      start: Date.now(),
      dwellDuration: 0,
      content: content,
      element: element,
      hoverDuration: 0,
      clickCount: 0,
      highlightCount: 0,
      hoverStart: 0,
      visible: true,
      xpath: getXPathByNode(element),
      url: window.location.href,
      page_title: document.title,
      uuid: getUUID(),
      // TODO: record highlighted text.
      highlightedText: [],
  }
}

function updateElementSignals(targetNode, type, duration=0) {
  let match = false;
  for (let key in elementMap) {
      let node = elementMap[key].element;
      // TODO: Check if two elements overlap: https://stackoverflow.com/questions/12066870/how-to-check-if-an-element-is-overlapping-other-elements
      if (node.contains(targetNode) || node.isEqualNode(targetNode) || node.id === targetNode.id) {
          if (type === "hover") {
              elementMap[key].hoverDuration += duration;
          } else if (type === "click") {
              elementMap[key].clickCount += 1;
          } else if (type === "highlight") {
              // Highlight involves click 
              // Because highlight is already recorded as a strong signal,
              // to avoid double counting, we mark the element as commited if possible
              elementMap[key].highlightCount += 1;
          } else if (type === "dwell") {
              elementMap[key].dwellDuration += duration;
          }
          match = true;
      }
  }
}

function getXPathByNode(node) {
  // Compute the XPath for the node
  const parts = [];
  while (node && node.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = node.previousSibling;
      while (sibling) {
          if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) {
              sibling = sibling.previousSibling;
              continue;
          }
          if (sibling.nodeName === node.nodeName) {
              index++;
          }
          sibling = sibling.previousSibling;
      }
      const nodeName = node.nodeName.toLowerCase();
      const pathIndex = (index ? '[' + (index + 1) + ']' : '');
      parts.unshift(nodeName + pathIndex);
      node = node.parentNode;
  }
  return parts.length ? '/' + parts.join('/') : null;
}

function getUUID() {
  function generateUniqueId() {
      return 'element-' + Math.random().toString(36).substr(2, 9);
  }
  return generateUniqueId();
}

// For debugging
setInterval(() => {
  // console.log("elementMap:", elementMap);
}, 5000);

// ======================
// 5. GAZE DOT VISUALIZATION
// ======================
const gazeDot = document.createElement('div');
gazeDot.style.position = 'absolute';
gazeDot.style.width = '10px';
gazeDot.style.height = '10px';
gazeDot.style.zIndex = '99999';
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
    
    // Update the traditional gaze tracking on text elements
    updateGazedVisibleTextElement(boundedX, boundedY);
    
    // Calculate adjusted positions taking scroll into account
    const offsetX = window.scrollX || document.documentElement.scrollLeft;
    const offsetY = window.scrollY || document.documentElement.scrollTop;
    gazeDot.style.transform = `translate3d(${boundedX + offsetX}px, ${boundedY + offsetY}px, 0)`;
  }
  return true;
});
