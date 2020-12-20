import { NOTIFICATION_CLOSE_DELAY, NOTIFICATION_FADE_DELAY, PREFIX } from './variables';

class Notifications {
    /**
     * Initialize notifications
     * @param {DOMElement} container
     */
    init(container) {
        this.notifications = container.querySelector('#' + PREFIX + 'notification_container');
    }

    /**
     * Show notification
     * @param  {string} message Message to show
     */
    notify(message) {
        const el = document.createElement('div');
        el.className = PREFIX + 'notification';
        el.innerHTML = message;
        this.notifications.appendChild(el);
        this.hideNotification(el);
    }

    /**
     * Hide all notifications
     * @param  {boolean} [instantly] Hide all notifications instantly
     */
    hideAllNotifications(instantly) {
        if (!this.notifications.hasChildNodes()) {
            return;
        }
        this.notifications.childNodes.forEach((el) => {
            this.hideNotification(el, instantly);
        });
    }

    /**
     * Hide notification
     * @param  {HTMLElement} el      Notification to hide
     * @param  {boolean} [instantly] Hide notification instantly
     */
    hideNotification(el, instantly) {
        if (instantly) {
            this.notifications.removeChild(el);
            return;
        }

        // Hide notification after delay
        setTimeout(() => {
            el.className += ' ' + PREFIX + 'notification_fade';
            setTimeout(() => {
                try {
                    this.notifications.removeChild(el);
                } catch (e) {
                    // Do nothing with error
                }
            }, NOTIFICATION_FADE_DELAY);
        }, NOTIFICATION_CLOSE_DELAY);
    }
}

export default new Notifications(); // Singleton
