import { PREFIX } from './init';
const forumNavElements = '.pagenav, .PageNav, .pagelinks, .paging, .pagination';

/**
 * Build forum navigation
 * @
 */
export function buildForumNav(container, forumNav) {
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
export function findForumNav() {
    let originalNav = document.querySelector(forumNavElements);
    if(originalNav) {
        return originalNav.cloneNode(true);
    }
    return null;
}