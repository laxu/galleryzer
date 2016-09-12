/**
 * Build forum navigation
 * @
 */
function buildForumNav(container, forumNav) {
    let forumNavWrapper = document.createElement('div');
    forumNavWrapper.setAttribute('id', PREFIX + 'forum_nav_wrapper');
    forumNavWrapper.appendChild(forumNav);

    forumNav.className += ' ' + PREFIX + 'forum_real_nav';
    forumNav.removeAttribute('align');

    let smfGoDownLink = forumNav.querySelector('a[href="#lastPost"]');
    if(smfGoDownLink) {
        forumNav.removeChild(smfGoDownLink); // Remove SMF "Go down" link
    }

    let firstChild = container.firstChild;
    if (firstChild) {
        container.insertBefore(forumNavWrapper, firstChild);
    } else {
        container.appendChild(forumNavWrapper);
    }
}


/**
 * Find forum navigation element
 */
function findForumNav() {
    let originalNav = document.querySelector(FORUM_NAV_ELEMENTS);
    if(originalNav) {
        return originalNav.cloneNode(true);
    }
    return null;
}