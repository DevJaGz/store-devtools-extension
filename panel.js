const $ = (query) => document.querySelector(query);
const $state = $("#state");

const actionStateList = [];

hljs.highlightAll();

chrome.storage.local.get(null, (items) => {
  const actionState = createActionState(items["store-devtools"]);
  actionStateList.push(actionState);
  renderNewActionState(actionState);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === "store-devtools") {
        const actionState = createActionState(newValue);
        actionStateList.push(actionState);
        renderNewActionState(actionState);
        break;
      }
    }
  }
});

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
    renderNewState(actionState.state);
  });
}

function renderNewState(state) {
  const rawState = JSON.stringify(state, null, 2);
  const highlightedCode = hljs.highlight(rawState, { language: "json" }).value;
  $state.innerHTML = highlightedCode;
}

function updateEmptyMsg($actionList) {
  const $emptyActionsMsg = $("#emptyActionsMsg");
  if ($actionList.children.length === 0) {
    $emptyActionsMsg.style.display = "block";
  } else {
    $emptyActionsMsg.style.display = "none";
  }
}
