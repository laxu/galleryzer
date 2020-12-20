/* eslint-disable no-undef */

function openGalleryzer() {
    console.log('fuu');
    // Init Galleryzer
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { toggleGalleryzer: true });
    });
}

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function () {
    openGalleryzer();
});

// Called when tab updates
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url.indexOf('galleryzerAutoOpen') !== -1) {
        openGalleryzer();
    }
});

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if (request.getSettings) {
        //Defaults
        var defaults = {
            minWidth: 200,
            background: 'dark',
            findForumNav: true,
        };

        //Load settings
        chrome.storage.sync.get(defaults, function (items) {
            sendResponse({
                settings: {
                    minWidth: items.minWidth,
                    background: items.background,
                    findForumNav: items.findForumNav,
                },
            });
        });
    }
});
