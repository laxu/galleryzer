// Auto 
if(window.location.href.indexOf(AUTO_OPEN_PARAM) !== -1) {
    document.addEventListener('DOMContentLoaded', function() {
        getSettings(initGallery);
    });
}

/**
 * Initialize gallery
 */
function initGallery() {
    desiredHeight = settings.minWidth / imgHeightRatio;
    buildGallery();
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
    hideEl(previewTextContext);
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
    let el = direction === 1 ? previewImg._galleryzerImageEl.nextSibling : previewImg._galleryzerImageEl.previousSibling;
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

    let textContent;

    if(img._galleryzedTextContent) {
        textContent = img._galleryzedTextContent;
    } else {
        // Find context text for image
        let textContentNode = img.parentNode.tagName === 'A' ? img.parentNode.parentNode : img.parentNode;
        let treeWalker = document.createTreeWalker(
            textContentNode, 
            NodeFilter.SHOW_TEXT, 
            { 
                acceptNode: function(node) {
                    const nodeData = node.data.trim();
                    if (nodeData.length && nodeData.indexOf('This image has been resized.') === -1) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            }
        );
        
        textContent = document.createDocumentFragment();
        
        while(treeWalker.nextNode()) {
            const textEl = document.createElement('p');
            textEl.textContent = treeWalker.currentNode.data;
            textContent.appendChild(textEl);
        }
        img._galleryzedTextContent = textContent;
    }

    if(textContent.hasChildNodes()) {
        previewTextContext.appendChild(textContent.cloneNode(true));   
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
    frame.addEventListener('click', function() {
        hideGallery();
    }, false);

    //Close gallery when you click the close button
    closeButton.addEventListener('click', function() {
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
            showEl(previewTextContext);
        }
    }, false);

    //Error loading image, show thumbnail
    previewImg.addEventListener('error', function() {
        if(previewImg.getAttribute('src') !== altImgURL) {
            previewImg.setAttribute('src', altImgURL);
            
            hideEl(previewSpinner);
            showEl(previewImg);
            showEl(previewTextContext);
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
            let imgURL = target.getAttribute('data-bigImage');
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
                let link = event.target.getAttribute('href');
                if(link) {
                    const paramSign = link.split('?').length > 1 ? '&' : '?';
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
    let el = document.createElement('div');
    el.setAttribute('id', frameID);
    el.className = settings.background;
    el.innerHTML = '<div id="' + PREFIX + 'gallery_background"></div>' +
    '<div id="' + PREFIX + 'gallery_preview"><div class="' + PREFIX + 'loader"></div><img id="' + PREFIX + 'preview_image"><div id="' + PREFIX + 'preview_text"></div></div>' +
    '<div id="' + PREFIX + 'gallery_container"><div id="' + PREFIX + 'close_button">X</div><div id="' + PREFIX + 'notification_container"></div><div id="' + PREFIX + 'gallery_wrapper">' + 
    '<div id="' + PREFIX + 'gallery_content"></div></div></div>';
    return el;
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

    if (settings.findForumNav) {
        forumNav = findForumNav();
        if(forumNav) {
            buildForumNav(container, forumNav);
        }
    }

    bindEventListeners();
}
