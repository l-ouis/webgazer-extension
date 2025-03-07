/**
 * Requests user permission for microphone access and sends a message to the parent window.
 */
function getUserPermission() {
    console.info('Getting user permission for camera access...');
  
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { width: 1280, height: 720 } })
      .then((response) => {
        if (response.id !== null && response.id !== undefined) {
          console.log('Camera access granted');
          window.parent.postMessage({ type: 'permissionsGranted' }, '*');
          return;
        }
        window.parent.postMessage(
          {
            type: 'permissionsFailed'
          },
          '*'
        );
      })
      .catch((error) => {
        console.warn('Error requesting camera permission: ', error);
        if (error.message === 'Permission denied') {
          window.alert(
            'Webgazer requires camera access to work.'
          );
        }
  
        window.parent.postMessage(
          {
            type: 'permissionsFailed',
            message: error.message
          },
          '*'
        );
      });
  }
  
getUserPermission();