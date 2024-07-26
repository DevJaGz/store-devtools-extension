console.log('panel.js');
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message from runtime: ', message);
  if (message.type === 'store-data') {
    const eventDataDiv = document.getElementById('eventData');
    if (eventDataDiv) {
      eventDataDiv.textContent = JSON.stringify(message.data, null, 2);
    }
    sendResponse({ status: 'success' });
  }
});