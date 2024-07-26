const eventList = [];

chrome.storage.local.get(null, (items) => {
  eventList.push(items['store-devtools']);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === 'store-devtools') {
        eventList.push(newValue);
        break
      }
    }
  }
});

