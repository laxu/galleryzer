/**
 * Set element CSS
 * @param {HTMLElement} el  Element whose CSS you want to set
 * @param {Object} obj     Key:value pairs of CSS properties
 */
function setCss(el, obj) {
    for(var prop in obj) {
        el.style[prop] = obj[prop];
    }
}

/**
 * Show element
 * @param  {HTMLElement} el Element to show
 */
function showEl(el) {
    el.style.display = 'block';
}

/**
 * Hide element
 * @param  {HTMLElement} el Element to hide
 */
function hideEl(el) {
    el.style.display = 'none';
}

/**
 * Show notification
 * @param  {string} message Message to show
 */
function notify(message) {
    el = document.createElement('div');
    el.className = PREFIX + 'notification';
    el.innerHTML = message;
    notifications.appendChild(el);
    hideNotification(el);
}

/**
 * Hide all notifications
 * @param  {Boolean} [instantly] Hide all notifications instantly
 */
function hideAllNotifications(instantly) {
    if (!notifications.hasChildNodes()) {
        return;
    }
    var notificationEls = notifications.childNodes;
    notificationEls.forEach(function(el) {
        hideNotification(el, instantly);
    });
}

/**
 * Hide notification
 * @param  {HTMLElement} el      Notification to hide
 * @param  {Boolean} [instantly] Hide notification instantly
 */
function hideNotification(el, instantly) {
    if(instantly) {
        notifications.removeChild(el);
    } else {
        setTimeout(function() {
            el.className += ' ' + PREFIX + 'notification_fade';
            setTimeout(function() {
                try {
                    notifications.removeChild(el);
                } catch(e) {
                    // Do nothing with error
                } 
            }, NOTIFICATION_FADE_DELAY);
        }, NOTIFICATION_CLOSE_DELAY);
    }
}

module.exports = {
	setCSS: setCSS,
	showEl: showEl,
	hideEl: hideEl,
	notify: notify,
	hideNotification: hideNotification,
	hideAllNotifications: hideAllNotifications
};