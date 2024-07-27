const $ = (query) => document.querySelector(query);
const actionStateList = [];

hljs.highlightAll();

chrome.storage.local.get(null, (items) => {
  const actionState = createActionState(items['store-devtools']);
  actionStateList.push(actionState);
  renderNewActionState(actionState);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (key === 'store-devtools') {
        const actionState = createActionState(newValue);
        actionStateList.push(actionState);
        renderNewActionState(actionState);
        break;
      }
    }
  }
});


function createActionState(item){
  return {
    id: crypto.randomUUID(),
    ...item
  }
}



function renderNewActionState(actionState){
  const $actionList = $('#actionsList');
  const $actionTemplate = $('#actionTemplate');
  if (!$actionTemplate){
    console.warn('Template not found', actionState);
    return;
  }
  const clone = $actionTemplate.content.cloneNode(true);
  const $summary = clone.querySelector('summary');
  const $pre = clone.querySelector('pre');
  $summary.textContent = actionState.actionId;
  $pre.textContent = JSON.stringify(actionState.payload, null, 2);
  hljs.highlightElement($pre);
  $actionList.appendChild(clone);
  updateEmptyMsg($actionList);
}

function updateEmptyMsg($actionList){
  const $emptyActionsMsg = $('#emptyActionsMsg');
  if ($actionList.children.length === 0){
    $emptyActionsMsg.style.display = 'block';
  } else {
    $emptyActionsMsg.style.display = 'none';
  }
}