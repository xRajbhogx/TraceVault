function showStatus(message, type) {
  var statusBox = document.getElementById('statusBox');
  var statusText = document.getElementById('statusText');
  statusText.textContent = message;
  statusBox.classList.remove('hidden', 'success', 'error');
  if (type === 'success') statusBox.classList.add('success');
  if (type === 'error') statusBox.classList.add('error');
}
function dataUrlToBytes(dataUrl) {
  var base64 = dataUrl.split(',')[1] || '';
  var binary = atob(base64);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
async function computeSHA256FromDataUrl(dataUrl) {
  var bytes = dataUrlToBytes(dataUrl);
  var hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}
function showEvidenceDetails(record) {
  document.getElementById('evidenceDetails').classList.remove('hidden');
  var url = record.platform_url || record.full_url || '';
  var displayUrl = url.length > 50 ? url.slice(0, 50) + '...' : url;
  document.getElementById('detailUrl').textContent = displayUrl;
  document.getElementById('detailTitle').textContent = record.page_title || '(no title)';
  document.getElementById('detailTime').textContent = record.captured_at;
  document.getElementById('detailHash').textContent = record.sha256_hash;
  document.getElementById('detailSnippet').textContent = record.page_text ? record.page_text.slice(0, 300) : '(no text)';
}
function loadUserId() {
  return new Promise(function(resolve) {
    chrome.storage.local.get('tracevaultUserId', function(result) {
      resolve(result.tracevaultUserId || '');
    });
  });
}
function saveUserId(userId) {
  chrome.storage.local.set({ tracevaultUserId: userId });
}
document.addEventListener('DOMContentLoaded', async function() {
  var userIdInput = document.getElementById('userIdInput');
  var savedUserId = await loadUserId();
  userIdInput.value = savedUserId;
  userIdInput.addEventListener('input', function() {
    saveUserId(userIdInput.value.trim());
  });
});
document.getElementById('captureBtn').addEventListener('click', async function() {
  var btn = document.getElementById('captureBtn');
  btn.disabled = true;
  showStatus('Capturing evidence...');
  document.getElementById('evidenceDetails').classList.add('hidden');
  try {
    var userIdInput = document.getElementById('userIdInput');
    var userId = userIdInput.value.trim();
    if (!userId) throw new Error('Please enter your User ID first.');
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs[0];
    if (!tab || !tab.id) throw new Error('Could not find the active tab.');
    var screenshotData = '';
    try {
      screenshotData = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 90 });
    } catch(e) {
      screenshotData = '';
    }
    if (!screenshotData) throw new Error('Unable to capture screenshot.');
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    var metadata = await chrome.tabs.sendMessage(tab.id, { action: 'extractMetadata' });
    if (!metadata || metadata.error) throw new Error(metadata ? metadata.error : 'No response from page.');
    var hash = await computeSHA256FromDataUrl(screenshotData);
    var pageContent = metadata.messageContent || metadata.textSnippet || '';
    var evidenceRecord = {
      device: 'extension',
      user_id: userId,
      captured_at: metadata.timestamp,
      screenshot_base64: screenshotData,
      sha256_hash: hash,
      platform: metadata.platform,
      platform_name: metadata.platform,
      platform_url: metadata.url,
      full_url: metadata.url,
      page_title: metadata.title,
      sender: metadata.sender,
      sender_id: metadata.sender,
      page_text: metadata.textSnippet,
      page_content: pageContent,
      message_content: metadata.messageContent,
      additional_context: metadata.textSnippet || ''
    };
    var stored = await chrome.storage.local.get('evidenceList');
    var evidenceList = stored.evidenceList || [];
    evidenceList.push(evidenceRecord);
    if (evidenceList.length > 20) evidenceList = evidenceList.slice(-20);
    await chrome.storage.local.set({ evidenceList: evidenceList });
    showStatus('Sending to backend...');
    try {
      var response = await fetch('https://tracevault-backend.onrender.com/evidence/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidenceRecord)
      });
      if (response.ok) {
        showStatus('Evidence captured and saved to backend!', 'success');
      } else {
        showStatus('Saved locally. Backend error: ' + response.status, 'success');
      }
    } catch(e) {
      showStatus('Saved locally. Backend offline.', 'success');
    }
    console.log('TraceVault Evidence Record:', JSON.stringify(evidenceRecord, null, 2));
    showEvidenceDetails(evidenceRecord);
  } catch(err) {
    showStatus('Error: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});
