// background.js
chrome.runtime.onInstalled.addListener(() => {
  // Set default to "enabled = true" on install
  chrome.storage.local.set({ enabled: true });
});

// This fires every time the user clicks the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  // Get the current "enabled" value
  chrome.storage.local.get(['enabled'], (data) => {
    const currentEnabled = data.enabled !== false; // default true if not set
    const newEnabled = !currentEnabled;            // flip the boolean

    // Update storage
    chrome.storage.local.set({ enabled: newEnabled }, () => {
      // Then notify the current active tab to enable or disable
      const action = newEnabled ? 'enable' : 'disable';
      chrome.tabs.sendMessage(tab.id, { action });
    });
  });
});
