/**
 * Find forum navigation element
 */
function findForumNav() {
    if(!settings.findForumNav) {
        return null;
    }

    var originalNav = document.querySelector(forumNavElements);
    if(originalNav) {
        return originalNav.cloneNode(true);
    }

    return null;
}