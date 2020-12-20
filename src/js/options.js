var minWidth, background, findForumNav;
var defaults = {
    minWidth: 200,
    background: 'dark',
    findForumNav: true,
};

var options = {
    save: function () {
        //Saves options to localStorage
        var minWidthValue = parseInt(minWidth.value);
        // eslint-disable-next-line no-undef
        chrome.storage.sync.set(
            {
                minWidth: minWidthValue >= 0 ? minWidthValue : defaults.minWidth,
                background: background.value,
                findForumNav: findForumNav.checked,
            },
            function () {
                //Update status to let user know options were saved
                var status = document.getElementById('status');
                status.textContent = 'Options Saved.';

                setTimeout(function () {
                    status.textContent = '';
                }, 1200);
            }
        );
    },
    restore: function () {
        // eslint-disable-next-line no-undef
        chrome.storage.sync.get(defaults, function (items) {
            minWidth.value = items.minWidth;
            background.value = items.background;
            findForumNav.checked = items.findForumNav;
        });
    },
};

document.addEventListener('DOMContentLoaded', function () {
    minWidth = document.getElementById('min_width');
    background = document.getElementById('background');
    findForumNav = document.getElementById('find_forum_nav');

    //Save button click event
    document.getElementById('save_button').addEventListener('click', options.save);

    options.restore();
});
