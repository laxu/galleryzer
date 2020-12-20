import {
    FADE_IN_DELAY,
    GALLERY_IMAGE_CLASS,
    NO_IMAGES_FOUND_WAIT_DELAY,
    RENDER_DELAY,
} from './variables';
import { imageSorter } from './helpers';
import Notifications from './notifications';

class ImageManager {
    init(settings, content) {
        this.content = content; // Content container element
        this.images = []; // Images suitable for gallery
        this.allImageSrcList = []; // List of all image sources to prevent duplicates
        this.renderTimer = null;
        this.desiredHeight = settings.desiredHeight;
        this.minWidth = settings.minWidth;
    }

    /**
     * Process an image to find if it's suitable for showing in the gallery
     * @param {Image} image Image being processed
     */
    processSingleImage(image) {
        image._hasGalleryzerLoader = true;
        if (!image.src) {
            if (image.getAttribute('data-src')) {
                // Tell XenForo lazyload plugin to fuck off
                const clone = image.cloneNode();
                clone.src = image.getAttribute('data-src');
                image.parentNode.replaceChild(clone, image);
                clone.addEventListener('load', () => this.processSingleImage(clone), false);
            }
            return; //No source available or element replaced
        }
        if (this.allImageSrcList.indexOf(image.src) === -1) {
            this.allImageSrcList.push(image.src);
        } else {
            //Duplicate
            return;
        }
        if (image.complete) {
            if (image._galleryzed || image._galleryzerRejected) {
                return;
            }
            if (
                image.src.includes('photobucket.com') &&
                image.width === 240 &&
                image.height === 240
            ) {
                return; // Missing Photobucket image
            }
            if (image.width >= this.minWidth && image.height >= this.desiredHeight) {
                this.images.push(image);

                if (this.renderTimer) {
                    clearTimeout(this.renderTimer);
                }
                this.renderTimer = setTimeout(() => {
                    this.renderImages();
                }, RENDER_DELAY);
                Notifications.hideAllNotifications(true);
            } else {
                // Unsuitable image
                image._galleryzerRejected = true;
            }
        }
    }

    /**
     * Find images on page and set them to gallery
     * @param {Array} images Images list
     */
    processImages() {
        if (!this.images.length) {
            Notifications.notify('Finding suitable images...');
        }
        for (let i = 0, len = document.images.length; i < len; i++) {
            const img = document.images[i];
            if (img.complete) {
                this.processSingleImage(img);
            } else if (!img._hasGalleryzerLoader) {
                img.addEventListener('load', () => this.processSingleImage(img), false);
            }
        }

        let timer = setTimeout(() => {
            if (!this.images.length) {
                Notifications.notify('No suitable images found.');
            }
            clearTimeout(timer);
        }, NO_IMAGES_FOUND_WAIT_DELAY);
    }

    /**
     * Create a gallery image element
     * @param  {Image}      img Image source element
     * @return {HTMLElement}    Gallery image element
     */
    createGalleryImageElement(img) {
        const el = document.createElement('div');
        el.className = GALLERY_IMAGE_CLASS;

        const bigVersion = img.parentNode.tagName === 'A' ? img.parentNode.href : false;

        if (bigVersion) {
            el.setAttribute('data-bigImage', bigVersion);
        }

        const imgEl = img.cloneNode();
        imgEl.className = '';
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
            if (!start) {
                start = timestamp;
            }
            const diff = timestamp - start;
            if (diff < FADE_IN_DELAY) {
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
    addImageToGallery(img, idx) {
        const imageEl = this.createGalleryImageElement(img, idx);
        const previousEl = idx === 0 ? this.content.firstChild : this.images[idx - 1]._galleryzedEl;
        this.content.insertBefore(
            imageEl,
            previousEl && previousEl.nextSibling ? previousEl.nextSibling : null
        );
    }

    /**
     * Render images to gallery
     */
    renderImages() {
        clearTimeout(this.renderTimer);
        this.images.sort(imageSorter);
        for (var idx = 0, len = this.images.length; idx < len; idx++) {
            var img = this.images[idx];
            if (!img._galleryzed) {
                this.addImageToGallery(img, idx);
            }
        }
    }
}

export default new ImageManager(); // Singleton
