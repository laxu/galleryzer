// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.executeScript(null, {file: 'main.js'});
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    //if(changeInfo.status === 'complete') {
        if(tab.url.indexOf('galleryzerAutoOpen') !== -1) {
            //chrome.tabs.executeScript(tabId, {file: 'main.js', runAt: 'document_end'});         
        }
    //}
});

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.getSettings) {
            //Defaults
            var defaults = {
                minWidth: 200,
                background: 'dark'
            };

            //Load settings
            chrome.storage.sync.get(defaults, function(items) {
                sendResponse({ 
                    settings: {
                        minWidth: items.minWidth,
                        background: items.background
                    }
                });
            });
        }
  });
  
