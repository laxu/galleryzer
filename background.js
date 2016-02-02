// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.executeScript(null, {file: "main.js"});
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
  
