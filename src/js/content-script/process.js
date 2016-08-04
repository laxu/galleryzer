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
            hideAllNotifications(true);
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

    var timer = setTimeout(function() {
        if(!images.length) {
            notify('No suitable images found.');
        }
        clearTimeout(timer);
    }, NO_IMAGES_FOUND_WAIT_DELAY);
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
    el._galleryzedOriginalImgNode = img;

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
