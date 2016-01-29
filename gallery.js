var settings = { 
    minWidth: 200 
};

/**
 * Get settings of extension
 */
function getSettings() {
    chrome.extension.sendRequest({ getSettings: true }, function(response) {
        if(response.settings) {
            settings = response.settings;
        }
    });
}

getSettings();

var prefix = 'only_images_',      //Prefix to avoid clashing classes etc
    galleryImageClass = prefix + 'gallery_image',

    frameID = prefix + 'gallery_frame',

    //Elements will be referenced with these
    frame, container, content, bg, closeButton,
    preview, previewImg, previewSpinner, 

    imgURL, altImgURL,  //Current image preview URLs

    prevBodyPosition,   //Used for saving previous body position state
    prevBodyOverflow,   //Used for saving previous body overflow state
    
    allImages = [],     //All images in page
    images = [],        //Images suitable for gallery
    imageSrcList = [],  //List of image sources to prevent duplicates

    KEY_ESC         = 27,
    KEY_RIGHT_ARROW = 39,
    KEY_LEFT_ARROW  = 37,

    previewOpen = false, 
    galleryOpen = false,
    contentChanged = false,

    previewPadding = 20,    //Image preview container padding
    imgScaleRatio  = 2.5,    //Image scaling ratio
    imgHeightRatio = 1.5,   //Value to determine if image is tall enough (to skip header images, banners etc)
    desiredHeight  = settings.minWidth / imgHeightRatio;

/**
 * Calculate window size
 * @return {Object} Window size object
 */
function getWindowSize()
{
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

var windowSize = getWindowSize();

/**
 * Set element CSS
 * @param {DOMElement} el  Element whose CSS you want to set
 * @param {Object} obj     Key:value pairs of CSS properties
 */
function setCss(el, obj) {
    for(var prop in obj) {
        el.style[prop] = obj[prop];
    }
}

function showEl(el) {
    el.style.display = 'block';
}

function hideEl(el) {
    el.style.display = 'none';
}

function showPreview() 
{
    showEl(bg);
    showEl(preview);
    previewOpen = true;
}

function hidePreview() 
{
    hideEl(preview);
    hideEl(bg);
    previewOpen = false;
}

function showGallery()
{
    showEl(frame);
    prevBodyPosition = document.body.style.position;
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.position = 'fixed';
    document.body.style.overflow = 'hidden';    //Prevent scrolling page
    galleryOpen = true;
}

function hideGallery() 
{
    hidePreview();
    hideEl(frame);
    document.body.style.position = prevBodyPosition;
    document.body.style.overflow = prevBodyOverflow;
    galleryOpen = false;
}

function notify(message) {
    var el = document.createElement('div');
    el.className = prefix + 'notification';
    el.innerHTML = message;
    document.body.appendChild(el);

    setTimeout(function() {
        hideEl(el);
        document.body.removeChild(el);
    }, 2000);
}

/**
 * Check if image is suitable for showing in gallery
 * @param  {DOMElement} img Source image element
 */
function parseImage(img) {
    var parent = img.parentNode;
    if(parent.className !== galleryImageClass && parent.id !== prefix + 'gallery_preview')
    {        
        if(img.width >= settings.minWidth && img.height >= desiredHeight)
        {
            if(imageSrcList.indexOf(img.src) === -1)
            {
                imageSrcList.push(img.src);
                images.push(img);
            }
        }
    }
}

/**
 * Create a gallery image element
 * @param  {DOMElement} img Image source element
 * @param  {number}     idx Image index
 * @return {DOMElement}     Gallery image element
 */
function createImageElement(img, idx) {
    var el = document.createElement('div');
    el.className = galleryImageClass;
    //el.style.maxWidth = Math.round(windowSize.width / imgScaleRatio) + 'px';

    var bigVersion = (img.parentNode.tagName === 'A') ? img.parentNode.href : false;
    
    if(bigVersion) {
        el.setAttribute('data-bigImage', bigVersion);
    }

    el.setAttribute('data-idx', idx);

    var imgEl = document.createElement('img');
    
    var alt = img.getAttribute('alt');
    var title = img.getAttribute('title');
    
    if(alt) {
        imgEl.setAttribute('alt', alt);    
    }

    if(title) {
        imgEl.setAttribute('title', title);
    }
    
    imgEl.setAttribute('src', img.getAttribute('src'));
    el.appendChild(imgEl);
    
    return el;
}

/**
 * Find images on page and set them to gallery
 */
function getImages() 
{
    contentChanged = false;
    if(!images.length || allImages.length !== document.images.length)
    {
        allImages = document.images;
        
        Array.prototype.forEach.call(allImages, parseImage);
        contentChanged = true;
    }

    return images.length ? true : false;
}

/**
 * Create gallery images
 */
function createImages() {
    if(images.length && contentChanged)
    {
        //Found suitable images
        var fragment = document.createDocumentFragment();

        images.forEach(function(img, idx) {
            fragment.appendChild(createImageElement(img, idx));
        });
        
        content.appendChild(fragment);
    }
}

/**
 * Change preview image
 * @param  {number} direction -1 for back, 1 for forward
 * @param  {number} currentIdx Index of current image
 */
function changePreviewImage(direction, currentIdx) {
    var newIndex = parseInt(currentIdx, 10) + direction;
    if(newIndex < 0) {
        newIndex = images.length - 1;
    } else if(newIndex >= images.length) {
        newIndex = 0;
    }

    var el = content.querySelector('[data-idx="' + newIndex + '"]');
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
    document.addEventListener('keyup', function(event)
    {
        if (event.keyCode === KEY_ESC) {
            if(previewOpen) {
                hidePreview();
                return false;
            }
            else if(galleryOpen)
            {
                hideGallery();
                return false;
            }
        } else if(previewOpen && event.keyCode === KEY_RIGHT_ARROW) {
            changePreviewImage(1, previewImg.getAttribute('data-idx'));
        } else if(previewOpen && event.keyCode === KEY_LEFT_ARROW) {
            changePreviewImage(-1, previewImg.getAttribute('data-idx'));
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

    //Image load event
    previewImg.addEventListener('load', function() {
        if(this.complete) 
        {
            preview.style.width = 'auto';
            preview.style.height = 'auto';

            preview.className = '';
            hideEl(previewSpinner);
            showEl(previewImg);
            // var w = Math.min(this.width, windowSize.width - previewPadding);
            // var h = Math.min(this.height, windowSize.height - previewPadding);

            // previewImg.setAttribute('width', w);
            // previewImg.setAttribute('height', h);
        }
    }, false);
    //Error loading image, show thumbnail
    previewImg.addEventListener('error', function() {
        if(previewImg.getAttribute('src') !== altImgURL)
        {
            previewImg.setAttribute('src', altImgURL);
            
            hideEl(previewSpinner);
            showEl(previewImg);
        }
    }, false);    

    content.addEventListener('click', function(event) {
        //Click event to show bigger image
        event.stopPropagation();
        var target = event.target;
        
        if(target.className !== galleryImageClass) {
            if(target.parentNode.className === galleryImageClass) {
                target = target.parentNode;
            } else {
                return false;    
            }
        }

        if(!previewOpen)
        {
            imgURL = target.getAttribute('data-bigImage');
            imgIdx = target.getAttribute('data-idx');
            altImgURL = target.querySelector('img').getAttribute('src');

            if(!imgURL) { 
                imgURL = altImgURL; 
            }

            windowSize = getWindowSize();

            if(imgURL !== previewImg.getAttribute('src')) {
                preview.className = 'loading';
                hideEl(previewImg);
                showEl(previewSpinner);
                previewImg.setAttribute('src', imgURL);
                previewImg.setAttribute('data-idx', imgIdx);
            }
                        
            showPreview();
        }
    }, false);
}

/**
 * Build gallery frame
 * @return {DOMElement}
 */
function buildFrame() {
    var el = document.createElement('div');
    el.setAttribute('id', frameID);
    el.className = settings.background;
    el.innerHTML = '<div id="' + prefix + 'gallery_background"></div>' +
    '<div id="' + prefix + 'gallery_preview"><div class="' + prefix + 'loader"></div><img id="' + prefix + 'preview_image"></div>' +
    '<div id="' + prefix + 'gallery_container"><div id="' + prefix + 'gallery_wrapper"><div id="' + prefix + 'close_button">X</div>' + 
    '<div id="' + prefix + 'gallery_content"></div></div></div>';
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

    container = frame.querySelector('#' + prefix + 'gallery_container');
    content = container.querySelector('#' + prefix + 'gallery_content');
    preview = frame.querySelector('#' + prefix + 'gallery_preview');
    previewImg = preview.querySelector('#' + prefix + 'preview_image');
    previewSpinner = preview.querySelector('.' + prefix + 'loader');
    bg = frame.querySelector('#' + prefix + 'gallery_background');
    closeButton = container.querySelector('#' + prefix + 'close_button');

    bindEventListeners();
}
