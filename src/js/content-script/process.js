/**
 * Process an image to find if it's suitable for showing in the gallery
 */
function processSingleImage() {
    this._hasGalleryzerLoader = true;
    if(!this.src) {
        if(this.getAttribute('data-src')) {
            // Tell XenForo lazyload plugin to fuck off
            const clone = this.cloneNode();
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
    if (!images.length) {
        notify('Finding suitable images...');
    }
    for(let i = 0, len = document.images.length; i < len; i++) {
        const img = document.images[i];
        if(img.complete) {
            processSingleImage.call(img);
        } else if(!img._hasGalleryzerLoader) {
            img.addEventListener('load', processSingleImage, false);
        }
    }

    let timer = setTimeout(function() {
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
    const el = document.createElement('div');
    el.className = galleryImageClass;

    const bigVersion = (img.parentNode.tagName === 'A') ? img.parentNode.href : false;
    
    if(bigVersion) {
        el.setAttribute('data-bigImage', bigVersion);
    }

    const imgEl = img.cloneNode();
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
    let start;

    function fadeIn(timestamp) {
        if(!start) {
            start = timestamp;
        }
        const diff = timestamp - start;
        if(diff < FADE_IN_DELAY) {
            window.requestAnimationFrame(fadeIn);
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
    const imageEl = createGalleryImageElement(img, idx);
    const previousEl = idx === 0 ? content.firstChild : images[idx - 1]._galleryzedEl;
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
