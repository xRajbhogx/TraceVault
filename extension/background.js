console.log('TraceVault: Background service worker started.');
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    chrome.storage.local.set({ evidenceList: [] });
    console.log('TraceVault: Storage initialized.');
  }
});
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'captureScreenshot') {
    chrome.tabs.get(message.tabId, function(tab) {
      if (chrome.runtime.lastError) { sendResponse({ error: chrome.runtime.lastError.message }); return; }
      chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png', quality: 90 }, function(dataUrl) {
        if (chrome.runtime.lastError) { sendResponse({ error: chrome.runtime.lastError.message }); return; }
        sendResponse({ screenshot: dataUrl });
      });
    });
    return true;
  }
});
