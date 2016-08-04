// Auto 
if(window.location.href.indexOf(AUTO_OPEN_PARAM) !== -1) {
    document.addEventListener("DOMContentLoaded", function(event) {
        getSettings(initGallery);
    });
}

/**
 * Get settings of extension
 * @param {Function} callback Execute callback when settings have been set
 */
function getSettings(callback) {
    chrome.extension.sendRequest({ getSettings: true }, function(response) {
        if(response.settings) {
            settings = response.settings;
            callback();
        }
    });
}

/**
 * Initialize gallery
 */
function initGallery() {
    desiredHeight = settings.minWidth / imgHeightRatio;
    buildGallery();
    notify('Finding suitable images...');
    processImages();
    showGallery();
}


/**
 * Show big image preview
 */
function showPreview() {
    showEl(bg);
    showEl(preview);
    previewOpen = true;
}

/**
 * Hide big image
 */
function hidePreview() {
    hideEl(preview);
    hideEl(bg);
    previewOpen = false;
}

/**
 * Show gallery
 */
function showGallery() {
    showEl(frame);
    
    //Save some page settings for later
    prevBodyPosition = document.body.style.position;
    prevBodyOverflow = document.body.style.overflow;
    prevScroll.x = window.scrollX;
    prevScroll.y = window.scrollY;
    
    document.body.style.position = 'fixed';
    document.body.style.overflow = 'hidden';    //Prevent scrolling page
    galleryOpen = true;
}

/**
 * Hide gallery
 */
function hideGallery() {
    hidePreview();
    hideEl(frame);
    document.body.style.position = prevBodyPosition;
    document.body.style.overflow = prevBodyOverflow;
    window.scrollTo(prevScroll.x, prevScroll.y);
    if(window.location.href.indexOf(AUTO_OPEN_PARAM) !== -1) {
        window.history.replaceState({}, window.title, window.location.href.replace(AUTO_OPEN_PARAM, ''));
    }
    galleryOpen = false;
}


/**
 * Change preview image
 * @param  {Number} direction -1 for back, 1 for forward
 */
function changePreviewImage(direction) {
    var el = direction === 1 ? previewImg._galleryzerImageEl.nextSibling : previewImg._galleryzerImageEl.previousSibling;
    if(!el) {
        // First or last element, loop to the other end
        el = direction === 1 ? content.firstChild : content.lastChild;
    }

    if(el) {
        hidePreview();
        el.dispatchEvent(new Event('click', { bubbles: true }));
    }
}

/**
 * Set preview text
 * @param {HTMLElement} img
 */
function changePreviewText(img) {
    while (previewTextContext.lastChild) {
        previewTextContext.removeChild(previewTextContext.lastChild); // Clear text context box
    }

    var textContent;

    if(img._galleryzedTextContent) {
        textContent = img._galleryzedTextContent;
    } else {
        // Find context text for image
        var textContentNode = img.parentNode.tagName === 'A' ? img.parentNode.parentNode : img.parentNode;
        var treeWalker = document.createTreeWalker(
            textContentNode, 
            NodeFilter.SHOW_TEXT, 
            { 
                acceptNode: function(node) { 
                    return node.data.trim().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP 
                }
            }
        );
        
        textContent = document.createDocumentFragment();
        
        while(treeWalker.nextNode()) {
            var textEl = document.createElement('p');
            textEl.textContent = treeWalker.currentNode.data;
            textContent.appendChild(textEl);
        }
        img._galleryzedTextContent = textContent;
    }

    if(textContent.hasChildNodes()) {
        previewTextContext.appendChild(textContent.cloneNode(true));
        showEl(previewTextContext);
    } else {
        hideEl(previewTextContext);
    }

    
}

/**
 * Bind event listeners for gallery functions
 */
function bindEventListeners() {
    //Close gallery or preview when esc is clicked
    document.addEventListener('keyup', function(event) {
        if (event.keyCode === KEY_ESC) {
            if(previewOpen) {
                hidePreview();
                return false;
            } else if(galleryOpen) {
                hideGallery();
                return false;
            }
        } else if(previewOpen && event.keyCode === KEY_RIGHT_ARROW) {
            changePreviewImage(1);
        } else if(previewOpen && event.keyCode === KEY_LEFT_ARROW) {
            changePreviewImage(-1);
        }
    }, false);
    
    //Close gallery when you click the transparent area outside it
    frame.addEventListener('click', function(event) {
        hideGallery();
    }, false);

    //Close gallery when you click the close button
    closeButton.addEventListener('click', function(event) {
        hideGallery();
    }, false);    

    //Prevent event bubbling beyond container
    container.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    //Hide preview when clicking the transparent background
    bg.addEventListener('click', function(event) {
        event.stopPropagation();
        hidePreview();
    }, false);
    
    //Close big image by clicking preview image
    previewImg.addEventListener('click', function(event) {
        event.stopPropagation();
        hidePreview();
    }, false);

    //Big image load event
    previewImg.addEventListener('load', function() {
        if(this.complete) {
            preview.style.width = 'auto';
            preview.style.height = 'auto';

            previewImg._galleryzed = true;

            preview.className = '';
            hideEl(previewSpinner);
            showEl(previewImg);
        }
    }, false);

    //Error loading image, show thumbnail
    previewImg.addEventListener('error', function() {
        if(previewImg.getAttribute('src') !== altImgURL) {
            previewImg.setAttribute('src', altImgURL);
            
            hideEl(previewSpinner);
            showEl(previewImg);
        }
    }, false);    

    //Click event to show bigger image
    content.addEventListener('click', function(event) {
        event.stopPropagation();
        var target = event.target;
        
        if(target.className !== galleryImageClass) {
            if(target.parentNode.className === galleryImageClass) {
                target = target.parentNode;
            } else {
                return false;    
            }
        }

        if(!previewOpen) {
            imgURL = target.getAttribute('data-bigImage');
            altImgURL = target.querySelector('img').getAttribute('src');

            if(!imgURL) { 
                imgURL = altImgURL; 
            }

            if(imgURL !== previewImg.getAttribute('src')) {
                preview.className = 'loading';
                hideEl(previewImg);
                showEl(previewSpinner);
                previewImg.setAttribute('src', imgURL);
                previewImg._galleryzerImageEl = target;
                
                changePreviewText(target._galleryzedOriginalImgNode);
            }
     
            showPreview();
        }
    }, false);

    if(settings.findForumNav && forumNav) { 
        //Add auto open gallery parameter when clicking forum nav link
        forumNav.addEventListener('click', function(event) {
            if(event.target.tagName === 'A') {
                event.preventDefault();
                event.stopPropagation();
                var link = event.target.getAttribute('href');
                if(link) {
                    var paramSign = link.split('?').length > 1 ? '&' : '?';
                    window.location.href = link + paramSign + AUTO_OPEN_PARAM;
                }
            }
        });
    }
}

/**
 * Build gallery frame
 * @return {HTMLElement}
 */
function buildFrame() {
    var el = document.createElement('div');
    el.setAttribute('id', frameID);
    el.className = settings.background;
    el.innerHTML = '<div id="' + PREFIX + 'gallery_background"></div>' +
    '<div id="' + PREFIX + 'gallery_preview"><div class="' + PREFIX + 'loader"></div><img id="' + PREFIX + 'preview_image"><div id="' + PREFIX + 'preview_text"></div></div>' +
    '<div id="' + PREFIX + 'gallery_container"><div id="' + PREFIX + 'close_button">X</div><div id="' + PREFIX + 'notification_container"></div><div id="' + PREFIX + 'gallery_wrapper">' + 
    '<div id="' + PREFIX + 'gallery_content"></div></div></div>';
    return el;
}

/**
 * Build forum navigation
 */
function buildForumNav() {
    var firstChild = container.firstChild;
    forumNavWrapper = document.createElement('div');
    forumNavWrapper.setAttribute('id', PREFIX + 'forum_nav_wrapper');
    forumNavWrapper.appendChild(forumNav);

    forumNav.className += ' ' + PREFIX + 'forum_real_nav';
    forumNav.removeAttribute('align');

    var smfGoDownLink = forumNav.querySelector('a[href="#lastPost"]');
    if(smfGoDownLink) {
        forumNav.removeChild(smfGoDownLink); // Remove SMF "Go down" link
    }

    if (firstChild) {
        container.insertBefore(forumNavWrapper, firstChild);
    } else {
        container.appendChild(forumNavWrapper);
    }
}

/**
 * Build and set gallery elements
 */
function buildGallery() {
    if(frame) {
        return; //Can only be run once
    }
    
    frame = buildFrame();

    document.body.appendChild(frame);

    container = frame.querySelector('#' + PREFIX + 'gallery_container');
    content = container.querySelector('#' + PREFIX + 'gallery_content');
    preview = frame.querySelector('#' + PREFIX + 'gallery_preview');
    previewImg = preview.querySelector('#' + PREFIX + 'preview_image');
    previewTextContext = preview.querySelector('#' + PREFIX + 'preview_text');
    previewSpinner = preview.querySelector('.' + PREFIX + 'loader');
    bg = frame.querySelector('#' + PREFIX + 'gallery_background');
    closeButton = container.querySelector('#' + PREFIX + 'close_button');
    notifications = container.querySelector('#' + PREFIX + 'notification_container');

    forumNav = findForumNav();
    if(forumNav) {
        buildForumNav();
    }

    bindEventListeners();
}
