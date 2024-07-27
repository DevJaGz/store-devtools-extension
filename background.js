chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openDevTools",
    title: "Open Store",
    contexts: ["all"],
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'store-data') {
      const { data } = message;
      const storageData = {
        ['store-devtools']: {
          actionId: data.actionId,
          payload: data.payload,
          state: data.state
        }
      };
      chrome.storage.local.set(storageData);
    }
  });

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'public/icon48.png',
    title: 'Store DevTools',
    message: 'Ready to use!',
    buttons: [
      { title: 'Ok.' }
    ],
    priority: 0
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openDevTools") {
    chrome.windows.getCurrent({ populate: true }, (currentWindow) => {
      const width = 800;
      const height = 600;
      const left = Math.floor((currentWindow.width - width) / 2);
      const top = Math.floor((currentWindow.height - height) / 2);
      chrome.windows.create({
        url: "panel.html",
        type: "popup",
        width,
        height,
        left,
        top,
      });
    });
  }
});






