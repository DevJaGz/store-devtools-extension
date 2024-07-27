const $ = (query) => document.querySelector(query);
const $codeWindow = $("#codeWindow");
const $tapBtns = $("#tabs").querySelectorAll("button");
const actionStateList = [];
const viewState = {
  tab: "state", // state, payload, diff
  actionStateSelected: null,
};


hljs.highlightAll();

$tapBtns.forEach(($tapBtn) => {
  $tapBtn.addEventListener("click", () => {
    const tab = $tapBtn.dataset.tab;
    const actionStateSelected = viewState.actionStateSelected;
    const tapBtnsList = Array.from($tapBtns);
    const $currentTabBtn = tapBtnsList.find(
      (btn) => btn.dataset.tab === viewState.tab
    );
    $currentTabBtn.classList.remove("active");
    $tapBtn.classList.add("active");
    viewState.tab = tab;
    if (actionStateSelected) {
      renderCodeWindow(actionStateSelected);
    }
  });
});

chrome.storage.local.get(null, (items) => {
  const rawActionStateList = items["store-devtools"];
  if (!rawActionStateList?.length) {
    clearPanel();
    return;
  }
  handleActionsStateRender(rawActionStateList);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === "store-devtools") {
        if (!newValue?.length) {
          clearPanel();
          return;
        }
        handleActionsStateRender(newValue);
        continue;
      }
    }
  }
});

function handleActionsStateRender(rawActionStateList) {
  const newStart = actionStateList.length;
  const newEnd = rawActionStateList.length;
  const newRawActionStateList = rawActionStateList.slice(newStart, newEnd);
  for (const newRawActionState of newRawActionStateList) {
    handleActionStateRender(newRawActionState);
  }
}

function handleActionStateRender(rawActionState) {
  const actionState = createActionState(rawActionState);
  actionStateList.push(actionState);
  renderNewActionState(actionState);
}

function createActionState(item) {
  return {
    id: crypto.randomUUID(),
    ...item,
  };
}

function renderNewActionState(actionState) {
  // renderActionStateWithExpandableTemplate(actionState);
  renderActionStateWithFixedTemplate(actionState);
}

function renderActionStateWithFixedTemplate(actionState) {
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

    const buttonList = $actionList.querySelectorAll("button");
    buttonList.forEach(($buttonItem) => {
      $buttonItem.classList.remove("active");
    });

    $btn.classList.add("active");
    renderCodeWindow(actionState);
  });

  if (actionStateList.length === 1) {
    $btn.click();
  }
}

function formatTime(date) {
  let hours = date.getHours().toString().padStart(2, '0');
  let minutes = date.getMinutes().toString().padStart(2, '0');
  let seconds = date.getSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

function renderActionStateWithExpandableTemplate(actionState) {
  const $actionList = $("#actionsList");
  const $actionTemplate = $("#actionTemplate");

  if (!$actionTemplate) {
    console.warn("Template not found", actionState);
    return;
  }

  const clone = $actionTemplate.content.cloneNode(true);
  const $summary = clone.querySelector("summary");
  const $code = clone.querySelector("code");

  $summary.textContent = actionState.actionId;
  $code.textContent = JSON.stringify(actionState.payload, null, 2);
  try {
    hljs.highlightElement($code);
  } catch (error) {
    console.warn(error);
  }
  $actionList.appendChild(clone);
  updateEmptyMsg($actionList);

  $summary.addEventListener("click", () => {
    viewState.actionStateSelected = actionState;

    const summaryList = $actionList.querySelectorAll("summary");
    summaryList.forEach(($summaryItem) => {
      $summaryItem.classList.remove("active");
    });

    $summary.classList.add("active");
    renderCodeWindow(actionState);
  });

  if (actionStateList.length === 1) {
    $summary.click();
  }
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

function updateEmptyMsg($actionList) {
  const $emptyActionsMsg = $("#emptyActionsMsg");
  if ($actionList.children.length === 0) {
    $emptyActionsMsg.style.display = "block";
  } else {
    $emptyActionsMsg.style.display = "none";
  }
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
