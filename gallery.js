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

var prefix = 'only_images_',    //Prefix to avoid clashing classes etc
    galleryImageClass = 'gallery_image',

    //Elements will be referenced with these
    frame, container, content, bg,
    preview, previewImg, previewSpinner, 

    imgURL, altImgURL,  //Current image preview URLs
    prevBodyOverflow,   //Used for saving previous body overflow state
    
    allImages = [],     //All images in page
    images = [],        //Images suitable for gallery
    imageSrcList = [],  //List of image sources to prevent duplicates

    frameID = prefix + 'gallery_frame',

    previewOpen = false, 
    galleryOpen = false,

    previewPadding = 20,    //Image preview container padding
    imgScaleRatio = 2.5,    //Image scaling ratio
    imgHeightRatio = 1.5,   //Value to determine if image is tall enough (to skip header images, banners etc)
    desiredHeight = settings.minWidth / imgHeightRatio;

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
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';    //Prevent scrolling page
    galleryOpen = true;
}

function hideGallery() 
{
    hidePreview();
    hideEl(frame);
    document.body.style.overflow = prevBodyOverflow;
    galleryOpen = false;
}

/**
 * Check if image is suitable for showing in gallery
 * @param  {DOMElement} img Source image element
 */
function parseImage(img) {
    var parent = img.parentNode;
    if(parent.className !== galleryImageClass && parent.id !== 'gallery_preview')
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
 * @return {DOMElement}     Gallery image element
 */
function createImageElement(img) {
    var el = document.createElement('div');
    el.className = galleryImageClass;
    //el.style.maxWidth = Math.round(windowSize.width / imgScaleRatio) + 'px';

    var bigVersion = (img.parentNode.tagName === 'A') ? img.parentNode.href : false;
    
    if(bigVersion) {
        el.setAttribute('data-bigImage', bigVersion);
    }

    var imgEl = document.createElement('img');
    
    var alt = img.getAttribute('alt');
    var title = img.getAttribute('title');
    
    if(alt) {
        imgEl.setAttribute('alt', alt);    
    }

    if(title) {
        imgEl.setAttribute('title', title);
    }
    
    imgEl.setAttribute('src', img.getAttribute('src'))
    el.appendChild(imgEl);
    
    return el;
}

/**
 * Find images on page and set them to gallery
 */
function getImages() 
{
    var contentChanged = false; 
    if(!images.length || allImages.length !== document.images.length)
    {
        allImages = document.images;
        
        Array.prototype.forEach.call(allImages, parseImage);
        contentChanged = true;
    }

    if(images.length && contentChanged)
    {
        //Found suitable images
        var fragment = document.createDocumentFragment();

        images.forEach(function(img) {
            fragment.appendChild(createImageElement(img));
        });
        
        content.appendChild(fragment);
    }
}

/**
 * Bind event listeners for gallery functions
 */
function bindEventListeners() {
    //Close gallery or preview when esc is clicked
    document.addEventListener('keyup', function(event)
    {
        if (event.which === 27) {
            if(previewOpen) {
                hidePreview();
                return false;
            }
            else if(galleryOpen)
            {
                hideGallery();
                return false;
            }
        }
    }, false);
    
    //Close gallery when you click the transparent area outside it
    frame.addEventListener('click', function(event) {
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
    el.innerHTML = '<div id="gallery_background"></div>' +
    '<div id="gallery_preview"><div class="loader"></div><img id="preview_image"></div><div id="gallery_container"><div id="gallery_wrapper"><div id="gallery_content"></div></div></div>';
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

    container = frame.querySelector('#gallery_container');
    content = container.querySelector('#gallery_content');
    preview = frame.querySelector('#gallery_preview');
    previewImg = preview.querySelector('#preview_image');
    previewSpinner = preview.querySelector('.loader');
    bg = frame.querySelector('#gallery_background');

    bindEventListeners();

}
