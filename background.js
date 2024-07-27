const actionStateList = [];

function clearStorageOnReload(details) {
  if (details.frameId === 0 && details.transitionType === "reload") {
    chrome.storage.local.clear();
    actionStateList.length = 0;
  }
}

function handleMessage(message, sender, sendResponse) {
  if (message.type === "store-data") {
    const { data } = message;
    const actionState = {
      actionId: data.actionId,
      payload: data.payload,
      state: data.state,
    };
    actionStateList.push(actionState);
    const storageData = {
      ["store-devtools"]: actionStateList,
    };
    chrome.storage.local.set(storageData);
  }
}

function createNotification() {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "public/icon48.png",
    title: "Store DevTools",
    message: "Ready to use!",
    buttons: [{ title: "Ok" }],
    priority: 0,
  });
}

function createContextMenu() {
  chrome.contextMenus.create({
    id: "openDevTools",
    title: "Open Store",
    contexts: ["all"],
  });
}

function handleContextMenuClick(info, tab) {
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
}

// Setup persistent event listeners
chrome.webNavigation.onCommitted.addListener(clearStorageOnReload);
chrome.runtime.onMessage.addListener(handleMessage);
chrome.contextMenus.onClicked.addListener(handleContextMenuClick);

// Setup initialization tasks
chrome.runtime.onInstalled.addListener(() => {
  createNotification();
  createContextMenu();
});
