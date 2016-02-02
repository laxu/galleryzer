var minWidth, background;
var defaults = {
    minWidth: 200,
    background: 'dark'
};

var options = {
    save: function () {
        //Saves options to localStorage
        var minWidthValue = parseInt(minWidth.value);
        chrome.storage.sync.set({
            minWidth: minWidthValue >= 0 ? minWidthValue : defaults.minWidth,
            background: background.value
        }, function() {
            //Update status to let user know options were saved
            var status = document.getElementById('status');
            status.textContent = 'Options Saved.';

            setTimeout(function() { 
                status.textContent = '';
            }, 1200);    
        });
    },
    restore: function() {
        chrome.storage.sync.get(defaults, function(items) {
            minWidth.value = items.minWidth;
            background.value = items.background;
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    minWidth = document.getElementById('min_width');
    background = document.getElementById('background');
    
    //Save button click event
    document.getElementById('save_button').addEventListener('click', options.save);
    
    options.restore();
});
