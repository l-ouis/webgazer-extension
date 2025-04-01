document.addEventListener('DOMContentLoaded', () => {
    // Clear chrome storage on load (if desired)
    chrome.storage.local.clear(() => {
      console.log("Chrome storage cleared on load.");
    });
  
    // Fetch up to 100 history entries
    chrome.history.search({ text: '', maxResults: 100 }, (historyItems) => {
      // Filter out extension pages (optional)
      const filteredItems = historyItems.filter(
        (item) => !item.url.startsWith('chrome-extension://')
      );
      // Sort descending by lastVisitTime
      filteredItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
      // Display the history as cards
      displayHistory(filteredItems);
    });
  });
  
  // Helper: Truncate URL if longer than maxLength
  function truncateUrl(url, maxLength = 150) {
    if (!url) return '';
    return url.length <= maxLength ? url : url.slice(0, maxLength) + '...';
  }
  
  // Display each history item as a card
  async function displayHistory(historyItems) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = ''; // Clear any previous content
  
    for (const item of historyItems) {
      // Create card container
      const card = document.createElement('div');
      card.className = 'history-card';
  
      // Create favicon box
      const faviconBox = document.createElement('div');
      faviconBox.className = 'favicon-box';
  
      // Create favicon image element
      const faviconImg = document.createElement('img');
      faviconImg.alt = 'favicon';
      faviconBox.appendChild(faviconImg);
  
      // Append favicon box to card
      card.appendChild(faviconBox);
  
      // Create content container
      const contentDiv = document.createElement('div');
      contentDiv.className = 'card-content';
  
      // Title element (first row)
      const titleEl = document.createElement('div');
      titleEl.className = 'title';
      titleEl.textContent = item.title || 'No title';
      contentDiv.appendChild(titleEl);
  
      // URL element (second row, grey, clickable, truncated)
      const urlEl = document.createElement('div');
      urlEl.className = 'url';
      const link = document.createElement('a');
      link.href = item.url;
      link.target = '_blank';
      link.textContent = truncateUrl(item.url, 150);
      urlEl.appendChild(link);
      contentDiv.appendChild(urlEl);
  
      // Timestamp element (third row)
      const timestampEl = document.createElement('div');
      timestampEl.className = 'timestamp';
      const dateObj = new Date(item.lastVisitTime);
      // Format the timestamp (e.g., "Apr 1, 2025, 10:30 AM")
      timestampEl.textContent = dateObj.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      contentDiv.appendChild(timestampEl);
  
      // Append content container to card, then card to container
      card.appendChild(contentDiv);
      container.appendChild(card);
  
      // Asynchronously download favicon using getFavicon
      const faviconBase64 = await getFavicon(item.url);
      if (faviconBase64) {
        faviconImg.src = faviconBase64;
      } else {
        // Fallback icon if no favicon found
        faviconImg.src = 'default-icon.png';
      }
    }
  }
  
  // Simple getFavicon function that always re-downloads the favicon
  async function getFavicon(pageUrl) {
    try {
      const hostname = new URL(pageUrl).hostname;
      const faviconUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
      const response = await fetch(faviconUrl);
      if (!response.ok) {
        console.error("Failed to fetch favicon:", response.statusText);
        return null;
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error downloading favicon:", error);
      return null;
    }
  }
  