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
  hljs.highlightElement($code);
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
  console.log('renderCodeWindow',actionState);
  const tab = viewState.tab;
  let rawCode = JSON.stringify(actionState.state, null, 2);
  if (tab === "payload") {
    rawCode = JSON.stringify(actionState.payload, null, 2);
  } else if (tab === "diff") {
    rawCode = '{ "diff": "TODO" }';
  }

  console.log('rawCode',rawCode);
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
  const $state = $("#state");
  const $emptyActionsMsg = $("#emptyActionsMsg");
  const emptyMsg = "No event data received";
  $emptyActionsMsg.style.display = "block";
  $actionsList.innerHTML = "";
  $emptyActionsMsg.textContent = emptyMsg;
  $state.innerHTML = emptyMsg;
  actionStateList.length = 0;
}
