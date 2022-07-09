const actionDict = {
  'tab': openTab,
  'greeting' : (_1, _2, sendResponse) => sendResponse({ farewell: "goodbye" })
}


function openTab(request, sender, sendResponse) {
  if(!request.endpoint) {
    console.log("No endpoint available to open!")
    return;
  }

  pageUrl = chrome.runtime.getURL("page/index.html");
  pageUrl += `?endpoint=${encodeURIComponent(request.endpoint)}`;
  chrome.tabs.create({
    url: pageUrl,
    selected: true,
  });
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if(request.action != null && request.action in actionDict) {
    // console.log('Performing action: ' + request.action)
    actionDict[request.action](request, sender, sendResponse);
  }
});
