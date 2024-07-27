const $ = (query) => document.querySelector(query);
const $state = $("#state");

const actionStateList = [];

hljs.highlightAll();

chrome.storage.local.get(null, (items) => {
  console.log(items);
  const rawActionStateList = items["store-devtools"];
  handleActionsStateRender(rawActionStateList);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === "store-devtools") {
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
    $actionList.querySelectorAll("summary").forEach(($action) => {
      console.log("removing", $action);
      $action.classList.remove("active");
    });
    $summary.classList.add("active");
    renderNewState(actionState.state);
  });
  if (actionStateList.length === 1) {
    $summary.click();
  }
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
