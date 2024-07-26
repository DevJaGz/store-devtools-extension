document.addEventListener('store-data', function(event) {
  const data = event.detail;
  chrome.runtime.sendMessage({ type: 'store-data', data: data });
});
console.log('content script loaded');