export function webpageFactory(url, title) {
    const webpageInfo = {
        url: url,
        title: title,
        timestamp: Date.now()
    };
    return webpageInfo;
}

// Metadata for tabs in the current browser window
// TODO: look into supporting parallel browsing sessions?
export class TabManager {
    constructor() {
        this.tabs = {};
        this.logPrefix = "[TabManager]";
    }
  
    log(message, ...optionalParams) {
        console.log(`${this.logPrefix} ${message}`, ...optionalParams);
    }
  
    // Register a tab
    addTab(tabId) {
        if (!this.tabs[tabId]) {
            this.tabs[tabId] = {
                latestPage: null, // Latest webpage info
                isClosed: false, // Status of the tab
                focusHistory: [], // Record of focus/unfocus timestamps
            };
            this.log(`Tab ${tabId} initialized.`);
        }
    }

    // Mark a tab as closed
    async closeTab(tabId) {
        if (this.tabs[tabId]) {
            this.tabs[tabId].isClosed = true;
            this.log(`Tab ${tabId} marked as closed.`);
        }
    }
  
  
    // Record a timestamp when a tab is unfocused
    unfocusTab(tabId) {
        if (this.tabs[tabId]) {
            this.tabs[tabId].focusHistory.push({ event: 'unfocused', timestamp: Date.now() });
            this.log(`Tab ${tabId} unfocused.`);
        }
    }
  
    // Record a timestamp when a tab gains focus
    focusTab(tabId) {
        if (this.tabs[tabId]) {
            this.tabs[tabId].focusHistory.push({ event: 'focused', timestamp: Date.now() });
            this.log(`Tab ${tabId} gained focus.`);
        }
    }
  
    // Add webpage info to a tab
    __addWebpage(tabId, webpageInfo) {
        if (this.tabs[tabId]) {
            this.tabs[tabId].latestPage = webpageInfo;
            this.log(`Webpage added to Tab ${tabId}:`, webpageInfo);
        }
    }
  
    // Update or insert a tab's URL/titel
    updateTabUrl(tabId, newUrl, title) {
        if (this.tabs[tabId]) {
            this.__addWebpage(tabId, webpageFactory(newUrl, title));
            this.log(`Tab ${tabId} URL updated to: ${newUrl}, ${title}`);
        } else {
            this.log(`Tab ${tabId} does not exist. Initializing.`);
            this.addTab(tabId);
            this.updateTabUrl(tabId, newUrl, title);
        }
    }

    // Retrieve metadata for all tabs
    getAllTabs() {
        return this.tabs;
    }

    // Retrieve metadata for a specific tab
    getTab(tabId) {
        return this.tabs[tabId] || null;
    }
}