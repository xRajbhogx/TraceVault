chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'extractMetadata') {
    try {
      var url = window.location.href;
      var title = document.title;
      var timestamp = new Date().toISOString();
      var fullText = document.body ? document.body.innerText : '';
      var textSnippet = fullText.replace(/\s+/g, ' ').trim().slice(0, 2000);

      // Platform detection
      var platform = 'Unknown';
      if (url.includes('instagram.com')) platform = 'Instagram';
      else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'Twitter/X';
      else if (url.includes('facebook.com')) platform = 'Facebook';
      else if (url.includes('reddit.com')) platform = 'Reddit';
      else if (url.includes('youtube.com')) platform = 'YouTube';
      else if (url.includes('tiktok.com')) platform = 'TikTok';
      else if (url.includes('snapchat.com')) platform = 'Snapchat';

      // Sender detection
      var sender = '';
      if (platform === 'Instagram' && url.includes('/direct/t/')) {
        var selectors = [
          'div[role="main"] header span',
          'div[role="main"] h1',
          'div[role="main"] header a span',
          '[data-testid="thread-detail-header"] span',
          'header[role="banner"] span'
        ];
        for (var i = 0; i < selectors.length; i++) {
          var el = document.querySelector(selectors[i]);
          if (el && el.innerText.trim().length > 0) {
            sender = el.innerText.trim();
            break;
          }
        }
        if (!sender) {
          var usernameMatch = fullText.match(/@[\w.]+/);
          if (usernameMatch) sender = usernameMatch[0];
        }
      } else if (platform === 'Twitter/X') {
        var twitterUser = document.querySelector('[data-testid="User-Name"] span');
        if (twitterUser) sender = twitterUser.innerText.trim();
      } else if (platform === 'Facebook') {
        var fbSender = document.querySelector('[data-testid="messenger-message-header"] span');
        if (fbSender) sender = fbSender.innerText.trim();
      } else {
        var ogMeta = document.querySelector('meta[property="og:title"]');
        if (ogMeta) sender = ogMeta.getAttribute('content') || '';
      }

      // Message content extraction
      var messageContent = '';

      if (platform === 'Instagram' && url.includes('/direct/t/')) {
        var msgs = [];
        var isInbox = url.includes('/direct/inbox') ||
                      !url.match(/\/direct\/t\/\d+/) ||
                      document.querySelector('[aria-label="Chats"]') !== null;

        if (!isInbox) {
          // Strategy 1: div[dir="auto"] — actual message bubbles
          var allDivs = document.querySelectorAll('div[dir="auto"]');
          allDivs.forEach(function(el) {
            var text = el.innerText.trim();
            if (text.length > 1 && text.length < 1000) {
              var isNoise = ['Message...','Send message','Like','Reply','React','More','Seen','Delivered'].includes(text);
              if (!isNoise && !msgs.includes(text)) msgs.push(text);
            }
          });

          // Strategy 2: role="row" containers
          if (msgs.length === 0) {
            document.querySelectorAll('[role="row"]').forEach(function(el) {
              var text = el.innerText.trim();
              if (text.length > 1 && text.length < 1000) msgs.push(text);
            });
          }

          // Strategy 3: aria-label on message bubbles
          if (msgs.length === 0) {
            document.querySelectorAll('[aria-label]').forEach(function(el) {
              var label = el.getAttribute('aria-label') || '';
              if (label.length > 5 && label.length < 500 &&
                  !label.includes('Navigate') && !label.includes('Button')) {
                msgs.push(label);
              }
            });
          }

          messageContent = msgs.slice(0, 15).join(' | ').slice(0, 1500);
        }

        if (!messageContent || messageContent.length < 5) {
          messageContent = '[INBOX VIEW — Please open a specific conversation first, then capture]';
        }

      } else if (platform === 'Twitter/X') {
        var tweets = document.querySelectorAll('[data-testid="tweetText"], [data-testid="messageEntry"]');
        var tweetMsgs = [];
        tweets.forEach(function(el) { var t = el.innerText.trim(); if (t.length > 0) tweetMsgs.push(t); });
        messageContent = tweetMsgs.slice(0, 10).join(' | ').slice(0, 1000);

      } else if (platform === 'Facebook') {
        var fbMsgs = document.querySelectorAll('[data-testid="message-text"], div[dir="auto"]');
        var fbTexts = [];
        fbMsgs.forEach(function(el) { var t = el.innerText.trim(); if (t.length > 1 && t.length < 500) fbTexts.push(t); });
        messageContent = fbTexts.slice(0, 10).join(' | ').slice(0, 1000);

      } else {
        var genericEls = document.querySelectorAll('[role="listitem"], [data-testid="message"], .message, .msg');
        var genericMsgs = [];
        genericEls.forEach(function(el) { var t = el.innerText.trim(); if (t.length > 0) genericMsgs.push(t); });
        messageContent = genericMsgs.slice(0, 5).join(' | ').slice(0, 500);
      }

      sendResponse({
        url: url,
        title: title,
        timestamp: timestamp,
        textSnippet: textSnippet,
        platform: platform,
        sender: sender,
        messageContent: messageContent
      });

    } catch(err) {
      sendResponse({ error: err.message });
    }
    return true;
  }
});