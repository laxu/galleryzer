var PREFIX = 'galleryzer_',      //Prefix to avoid clashing classes etc
    galleryImageClass = PREFIX + 'gallery_image',

    frameID = PREFIX + 'gallery_frame',

    //Elements will be referenced with these
    frame, container, content, bg, closeButton,
    preview, previewImg, previewSpinner, 

    imgURL, altImgURL,  //Current image preview URLs

    prevBodyPosition,               //Used for saving previous body position state
    prevBodyOverflow,               //Used for saving previous body overflow state
    prevScroll = { x: 0, y: 0 },    //Used for saving previous scroll position
    
    images = [],                    //Images suitable for gallery
    allImageSrcList = [],           //List of all image sources to prevent duplicates

    settings,

    //Keyboard keycodes used
    KEY_ESC         = 27,
    KEY_RIGHT_ARROW = 39,
    KEY_LEFT_ARROW  = 37,

    previewOpen = false, 
    galleryOpen = false,
    contentChanged = false,

    previewPadding = 20,    //Image preview container padding
    imgScaleRatio  = 2.5,    //Image scaling ratio
    imgHeightRatio = 1.5,   //Value to determine if image is tall enough (to skip header images, banners etc)
    desiredHeight,
    
    renderTimer,
    RENDER_DELAY = 100,
    FADE_IN_DELAY = 400,

    forumNav,
    forumNavWrapper,
    forumNavElements = '.pagenav, .PageNav',
    FORUM_XENFORO = 'xenforo',
    FORUM_VB = 'vBulletin',
    AUTO_OPEN_PARAM = 'galleryzerAutoOpen';

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
    processImages();
    showGallery();
}

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
    galleryOpen = false;
}

/**
 * Show notification
 * @param  {string} message Message to show
 */
function notify(message) {
    var el = document.createElement('div');
    el.className = PREFIX + 'notification';
    el.innerHTML = message;
    document.body.appendChild(el);

    setTimeout(function() {
        hideEl(el);
        document.body.removeChild(el);
    }, 2000);
}

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

/**
 * Process an image to find if it's suitable for showing in the gallery
 */
function processSingleImage() {
    this._hasGalleryzerLoader = true;
    if(!this.src) {
        if(this.getAttribute('data-src')) {
            // Tell XenForo lazyload plugin to fuck off
            var clone = this.cloneNode();
            clone.src = this.getAttribute('data-src');
            this.parentNode.replaceChild(clone, this);
            clone.addEventListener('load', processSingleImage, false);
        }
        return; //No source available or element replaced
    }
    if(allImageSrcList.indexOf(this.src) === -1) {
        allImageSrcList.push(this.src);
    } else {
        //Duplicate
        return;
    }
    if(this.complete) {
        if(this._galleryzed || this._galleryzerRejected) {
            return;
        }
        if(this.width >= settings.minWidth && this.height >= desiredHeight) {
            images.push(this);
            if(renderTimer) {
                clearTimeout(renderTimer);
            }
            renderTimer = setTimeout(renderImages, RENDER_DELAY);
        } else {
            // Unsuitable image
            this._galleryzerRejected = true;
        }
    }
}

/**
 * Find images on page and set them to gallery
 * @return {boolean}
 */
function processImages() {
    for(var idx = 0, len = document.images.length; idx < len; idx++) {
        var img = document.images[idx];
        if(img.complete) {
            processSingleImage.call(img);
        } else if(!img._hasGalleryzerLoader) {
            img.addEventListener('load', processSingleImage, false);
        }
    }
}

/**
 * Sort images based on their orginal DOM position
 * @param  {HTMLElement} a 
 * @param  {HTMLElement} b 
 * @return {boolean}
 */
function imageSorter(a, b) {
    if(a === b) return 0;
    if(a.compareDocumentPosition(b) & 2) {
        return 1; // b comes before a
    }
    return -1;
}

/**
 * Create a gallery image element
 * @param  {Image}      img Image source element
 * @return {HTMLElement}    Gallery image element
 */
function createGalleryImageElement(img) {
    var el = document.createElement('div');
    el.className = galleryImageClass;

    var bigVersion = (img.parentNode.tagName === 'A') ? img.parentNode.href : false;
    
    if(bigVersion) {
        el.setAttribute('data-bigImage', bigVersion);
    }

    var imgEl = img.cloneNode();
    imgEl.removeAttribute('style');
    imgEl.removeAttribute('onload');
    imgEl.removeAttribute('width');
    imgEl.removeAttribute('height');
    imgEl.style.width = 'auto';
    imgEl.style.height = 'auto';

    el.appendChild(imgEl);
    
    imgEl._galleryzed = true;
    img._galleryzed = true;
    img._galleryzedEl = el;

    imgEl.style.opacity = 0;
    var start = null;

    function fadeIn(timestamp) {
        if(!start) {
            start = timestamp;
        }
        var diff = timestamp - start;
        if(diff < FADE_IN_DELAY) {
            window.requestAnimationFrame(fadeIn)
        } else {
            imgEl.style.opacity = 1;
        }
    }
    window.requestAnimationFrame(fadeIn);
    
    return el;
}

/**
 * Add image to gallery
 * @param {HTMLElement} img Image element
 * @param {Number} idx      Index in images list
 */
function addImageToGallery(img, idx) {
    var imageEl = createGalleryImageElement(img, idx);
    var previousEl = idx === 0 ? content.firstChild : images[idx - 1]._galleryzedEl;
    content.insertBefore(imageEl, previousEl && previousEl.nextSibling ? previousEl.nextSibling : null);
}

/**
 * Render images to gallery
 */
function renderImages() {
    clearTimeout(renderTimer);
    images.sort(imageSorter);
    for(var idx = 0, len = images.length; idx < len; idx++) {
        var img = images[idx];
        if(!img._galleryzed) {
            addImageToGallery(img, idx);
        }
    }
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
                    window.location.href = link + paramSign + AUTO_OPEN_PARAM + '=1';
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
    '<div id="' + PREFIX + 'gallery_preview"><div class="' + PREFIX + 'loader"></div><img id="' + PREFIX + 'preview_image"></div>' +
    '<div id="' + PREFIX + 'gallery_container"><div id="' + PREFIX + 'close_button">X</div><div id="' + PREFIX + 'gallery_wrapper">' + 
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
    previewSpinner = preview.querySelector('.' + PREFIX + 'loader');
    bg = frame.querySelector('#' + PREFIX + 'gallery_background');
    closeButton = container.querySelector('#' + PREFIX + 'close_button');

    forumNav = findForumNav();
    if(forumNav) {
        buildForumNav();
    }

    bindEventListeners();
}
