function getDOM() {
    return document.body.innerHTML;
}

function getTabId() {
    return chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        return tabs[0].id;
    });
}

chrome.scripting.executeScript({
  func: getDOM,
  target: {tabId: getTabId()}
}).then((result) => {
    console.log(result);
})



