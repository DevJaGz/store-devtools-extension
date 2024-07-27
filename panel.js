// Utility Functions
const $ = (query) => document.querySelector(query);

// DOM Elements
const $codeWindow = $("#codeWindow");
const $tapBtns = $("#tabs").querySelectorAll("button");

// State Management
const actionStateList = [];
const viewState = {
  tab: "state", // state, payload, diff
  actionStateSelected: null,
};

// Initialize Syntax Highlighting
hljs.highlightAll();

// Event Listeners
initializeTabButtons();
initializeStorageListener();
loadInitialStateFromStorage();

// Function Definitions

function initializeTabButtons() {
  $tapBtns.forEach(($tapBtn) => {
    $tapBtn.addEventListener("click", () => handleTabClick($tapBtn));
  });
}

function handleTabClick($tapBtn) {
  const tab = $tapBtn.dataset.tab;
  const actionStateSelected = viewState.actionStateSelected;

  $tapBtns.forEach((btn) => btn.classList.toggle("active", btn === $tapBtn));
  viewState.tab = tab;

  if (actionStateSelected) {
    renderCodeWindow(actionStateSelected);
  }
}

function initializeStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes["store-devtools"]) {
      const newValue = changes["store-devtools"].newValue;
      if (!newValue?.length) {
        clearPanel();
      } else {
        handleActionsStateRender(newValue);
      }
    }
  });
}

function loadInitialStateFromStorage() {
  chrome.storage.local.get(null, (items) => {
    const rawActionStateList = items["store-devtools"];
    if (!rawActionStateList?.length) {
      clearPanel();
    } else {
      handleActionsStateRender(rawActionStateList);
    }
  });
}

function handleActionsStateRender(rawActionStateList) {
  const newActionStates = rawActionStateList.slice(actionStateList.length);
  newActionStates.forEach(handleActionStateRender);
}

function handleActionStateRender(rawActionState) {
  const actionState = createActionState(rawActionState);
  actionStateList.push(actionState);
  renderActionState(actionState);
}

function createActionState(item) {
  return {
    id: crypto.randomUUID(),
    ...item,
  };
}

function renderActionState(actionState) {
  const $actionList = $("#actionsList");
  const $actionTemplate = $("#actionTemplateBtn");
  if (!$actionTemplate) {
    console.warn("Template not found", actionState);
    return;
  }
  
  const clone = $actionTemplate.content.cloneNode(true);
  const $btn = clone.querySelector("button");
  $btn.querySelector("span:first-child").textContent = actionState.actionId;
  $btn.querySelector("span:last-child").textContent = formatTime(new Date());
  $actionList.appendChild(clone);
  
  updateEmptyMsg($actionList);
  
  $btn.addEventListener("click", () => {
    viewState.actionStateSelected = actionState;
    setActiveButton($actionList, $btn);
    renderCodeWindow(actionState);
  });
  
  if (actionStateList.length === 1) {
    $btn.click();
  }
}

function setActiveButton($actionList, $btn) {
  $actionList.querySelectorAll("button").forEach(($buttonItem) => {
    $buttonItem.classList.toggle("active", $buttonItem === $btn);
  });
}

function renderCodeWindow(actionState) {
  const tab = viewState.tab;
  let rawCode = JSON.stringify(actionState.state, null, 2);

  if (tab === "payload") {
    rawCode = JSON.stringify(actionState.payload, null, 2);
  } else if (tab === "diff") {
    rawCode = '{ "diff": "TODO" }';
  }

  try {
    const highlightedCode = hljs.highlight(rawCode, { language: "json" }).value;
    $codeWindow.innerHTML = highlightedCode;
  } catch (error) {
    console.warn(error);
  }
}

function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function updateEmptyMsg($actionList) {
  const $emptyActionsMsg = $("#emptyActionsMsg");
  $emptyActionsMsg.style.display = $actionList.children.length === 0 ? "block" : "none";
}

function clearPanel() {
  const $actionsList = $("#actionsList");
  const $emptyActionsMsg = $("#emptyActionsMsg");
  const emptyMsg = "No event data received";
  $emptyActionsMsg.style.display = "block";
  $actionsList.innerHTML = "";
  $emptyActionsMsg.textContent = emptyMsg;
  $codeWindow.innerHTML = emptyMsg;
  actionStateList.length = 0;
}
