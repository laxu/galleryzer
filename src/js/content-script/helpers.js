/**
 * Get settings of extension
 * @param {Function} callback Execute callback when settings have been set
 */
export function getSettings(callback) {
    // eslint-disable-next-line no-undef
    chrome.extension.sendRequest({ getSettings: true }, function (response) {
        callback(response && response.settings ? response.settings : null);
    });
}

/**
 * Show element
 * @param  {HTMLElement} el Element to show
 */
export function showEl(el) {
    el.style.display = 'block';
}

/**
 * Hide element
 * @param  {HTMLElement} el Element to hide
 */
export function hideEl(el) {
    el.style.display = 'none';
}

/**
 * Sort images based on their orginal DOM position
 * @param  {HTMLElement} a
 * @param  {HTMLElement} b
 * @return {boolean}
 */
export function imageSorter(a, b) {
    if (a === b) return 0;
    if (a.compareDocumentPosition(b) & 2) {
        return 1; // b comes before a
    }
    return -1;
}
