function showStatus(message, type) {
  var statusBox = document.getElementById('statusBox');
  var statusText = document.getElementById('statusText');
  statusText.textContent = message;
  statusBox.classList.remove('hidden', 'success', 'error');
  if (type === 'success') statusBox.classList.add('success');
  if (type === 'error') statusBox.classList.add('error');
}
async function computeSHA256(text) {
  var encoder = new TextEncoder();
  var data = encoder.encode(text);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
}
function showEvidenceDetails(record) {
  document.getElementById('evidenceDetails').classList.remove('hidden');
  var displayUrl = record.full_url.length > 50 ? record.full_url.slice(0, 50) + '...' : record.full_url;
  document.getElementById('detailUrl').textContent = displayUrl;
  document.getElementById('detailTitle').textContent = record.page_title || '(no title)';
  document.getElementById('detailTime').textContent = record.captured_at;
  document.getElementById('detailHash').textContent = record.sha256_hash;
  document.getElementById('detailSnippet').textContent = record.page_text ? record.page_text.slice(0, 300) : '(no text)';
}
document.getElementById('captureBtn').addEventListener('click', async function() {
  var btn = document.getElementById('captureBtn');
  btn.disabled = true;
  showStatus('Capturing evidence...');
  document.getElementById('evidenceDetails').classList.add('hidden');
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    var tab = tabs[0];
    if (!tab || !tab.id) throw new Error('Could not find the active tab.');
    var screenshotData = '';
    try {
      screenshotData = await chrome.tabs.captureVisibleTab(null, { format: 'png', quality: 90 });
    } catch(e) {
      screenshotData = '';
    }
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    var metadata = await chrome.tabs.sendMessage(tab.id, { action: 'extractMetadata' });
    if (!metadata || metadata.error) throw new Error(metadata ? metadata.error : 'No response from page.');
    var dataToHash = metadata.url + metadata.title + metadata.timestamp + metadata.textSnippet;
    var hash = await computeSHA256(dataToHash);
    var evidenceRecord = {
      device: 'extension',
      user_id: 'clerk_user_id',
      captured_at: metadata.timestamp,
      image_base64: screenshotData,
      sha256_hash: hash,
      platform: metadata.platform,
      full_url: metadata.url,
      page_title: metadata.title,
      sender: metadata.sender,
      page_text: metadata.textSnippet,
      message_content: metadata.messageContent,
      additional_context: ''
    };
    var stored = await chrome.storage.local.get('evidenceList');
    var evidenceList = stored.evidenceList || [];
    evidenceList.push(evidenceRecord);
    if (evidenceList.length > 20) evidenceList = evidenceList.slice(-20);
    await chrome.storage.local.set({ evidenceList: evidenceList });
    showStatus('Sending to backend...');
    try {
      var response = await fetch('https://tracevault-backend.onrender.com/api/evidence', {
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
