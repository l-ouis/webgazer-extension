# Webgazer Extension


```
contentScript.js: grabs data from the current tab
gives window data and text @ predicted coordinate to background.js
if we’re implementing rewinds/replay, gets data from background.js to recreate trail

background.js: grabs camera data and does actual prediction math
gives prediction coords to content script
gives parsed data and results to popup.js and contentscript.js

popup.js: gets the results and data from background.js to display to user somehow

options.js: needed to grant camera access
```

https://www.w3schools.com/Jsref/prop_win_pagexoffset.asp

^ can use this to get the page coordinate of the gaze dot


TODO:

- make sure th receiving end of chrome messages always exist. 