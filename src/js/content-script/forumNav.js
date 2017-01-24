/**
 * Build forum navigation
 * @
 */
function buildForumNav(container, forumNav) {
    const forumNavWrapper = document.createElement('div');
    forumNavWrapper.setAttribute('id', PREFIX + 'forum_nav_wrapper');
    const forumNavLinks = forumNav.querySelectorAll(FORUM_NAV_LINK_ELEMENTS);
    const forumNavList = document.createElement('ul');
    forumNavList.className = PREFIX + 'forum_nav_list';
    forumNavWrapper.appendChild(forumNavList);

    const smfGoDownLink = '#lastPost';

    for (let i = 0, len = forumNavLinks.length; i < len; i++) {
        const el = forumNavLinks[i];
        let linkUrl = el.getAttribute('href') || '';
        if (el.tagName === 'A' && !linkUrl || linkUrl === '#' || linkUrl === smfGoDownLink) {
            continue;
        }

        const paramSign = linkUrl.split('?').length > 1 ? '&' : '?';
        linkUrl = linkUrl + paramSign + AUTO_OPEN_PARAM;
        
        const listEl = document.createElement('li');
        listEl.className = PREFIX + 'forum_nav_list_element';

        const linkEl = document.createElement(el.tagName === 'STRONG' ? 'span' : 'a');
        linkEl.setAttribute('href', linkUrl);
        linkEl.textContent = el.textContent;
        linkEl.className = PREFIX + 'forum_nav_link';
        if (isCurrentPage(el)) {
            linkEl.className += ' ' + PREFIX + 'forum_nav_link_current_page';
        }
        listEl.appendChild(linkEl);
        forumNavList.appendChild(listEl);
    }

    container.className = PREFIX + 'has_forum_nav';
    const firstChild = container.firstChild;
    if (firstChild) {
        container.insertBefore(forumNavWrapper, firstChild);
    } else {
        container.appendChild(forumNavWrapper);
    }
}

/**
 * Is forum nav element the current page
 * @param  {DOMElement}  el
 * @return {Boolean}
 */
function isCurrentPage(el) {
    const classNamesList = [ el.className ];
    if (el.parentNode) {
        classNamesList.push(el.parentNode.className);
    }
    if (el.parentNode.parentNode) {
        classNamesList.push(el.parentNode.parentNode.className);
    }
    const classNames = classNamesList.join(' ');
    return FORUM_CURRENT_PAGE_CLASSES.some(currentPageClass => classNames.includes(currentPageClass));
}

/**
 * Find forum navigation element
 */
function findForumNav() {
    const originalNav = document.querySelector(FORUM_NAV_ELEMENTS);
    if(originalNav) {
        return originalNav.cloneNode(true);
    }
    return null;
}