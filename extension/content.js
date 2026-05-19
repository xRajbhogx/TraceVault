chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'extractMetadata') {
    try {
      var url = window.location.href;
      var title = document.title;
      var timestamp = new Date().toISOString();
      var fullText = document.body ? document.body.innerText : '';
      var textSnippet = fullText.replace(/\s+/g, ' ').trim().slice(0, 2000);
      var platform = 'Unknown';
      if (url.includes('instagram.com')) platform = 'Instagram';
      else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'Twitter/X';
      else if (url.includes('facebook.com')) platform = 'Facebook';
      else if (url.includes('reddit.com')) platform = 'Reddit';
      else if (url.includes('youtube.com')) platform = 'YouTube';
      else if (url.includes('tiktok.com')) platform = 'TikTok';
      else if (url.includes('snapchat.com')) platform = 'Snapchat';
      var sender = '';
      var senderMeta = document.querySelector('meta[property="og:title"]');
      if (senderMeta) sender = senderMeta.getAttribute('content') || '';
      var messageContent = '';
      var msgElements = document.querySelectorAll('[role="listitem"], [data-testid="message"], .message, .msg');
      if (msgElements.length > 0) {
        var msgs = [];
        msgElements.forEach(function(el) { var t = el.innerText.trim(); if (t.length > 0) msgs.push(t); });
        messageContent = msgs.slice(0, 5).join(' | ').slice(0, 500);
      }
      sendResponse({ url: url, title: title, timestamp: timestamp, textSnippet: textSnippet, platform: platform, sender: sender, messageContent: messageContent });
    } catch(err) {
      sendResponse({ error: err.message });
    }
    return true;
  }
});
