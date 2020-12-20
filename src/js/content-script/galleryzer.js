import {
    AUTO_OPEN_PARAM,
    FRAME_ID,
    GALLERY_IMAGE_CLASS,
    IMAGE_HEIGHT_RATIO,
    KEY_ESC,
    KEY_LEFT_ARROW,
    KEY_RIGHT_ARROW,
    PREFIX,
} from './variables';
import { showEl, hideEl } from './helpers';
import ImageManager from './imageManager';
import Notifications from './notifications';
import { buildForumNav, findForumNav } from './forumNav';

let prevBodyPosition; // Used for saving previous body position state
let prevBodyOverflow; // Used for saving previous body overflow state
let prevScroll = { x: 0, y: 0 }; // Used for saving previous scroll position

export default class Gallery {
    constructor(settings) {
        this.initialized = false;
        this.settings = null; // Settings from chrome options will be loaded here

        this.isOpen = false;
        this.isPreviewOpen = false;

        this.previewAltImgURL = null; // Current image preview URL
        this.imgHeightRatio = IMAGE_HEIGHT_RATIO;

        //Elements will be referenced with these
        this.elements = {
            frame: null,
            container: null,
            bg: null,
            closeButton: null,
            preview: {
                container: null,
                img: null,
                textContext: null,
                spinner: null,
            },
            forumNav: null,
        };

        this.settings = settings;
        const desiredHeight = this.settings.minWidth / this.imgHeightRatio;
        this.buildGallery();
        this.setupFormNav();
        this.bindEventListeners();
        Notifications.init(this.elements.container);
        ImageManager.init({ ...this.settings, desiredHeight }, this.elements.content);

        this.initialized = true;
    }

    toggleGallery() {
        if (this.isOpen) {
            this.hideGallery();
            return;
        }
        this.openGallery();
    }

    /**
     * Load images and open gallery
     */
    openGallery() {
        ImageManager.processImages();
        this.showGallery();
    }

    /**
     * Show big image preview
     */
    showPreview() {
        showEl(this.elements.bg);
        showEl(this.elements.preview.container);
        this.isPreviewOpen = true;
    }

    /**
     * Hide big image
     */
    hidePreview() {
        hideEl(this.elements.preview.container);
        hideEl(this.elements.bg);
        this.isPreviewOpen = false;
    }

    /**
     * Show gallery
     */
    showGallery() {
        showEl(this.elements.frame);

        //Save some page settings for later
        prevBodyPosition = document.body.style.position;
        prevBodyOverflow = document.body.style.overflow;
        prevScroll.x = window.scrollX;
        prevScroll.y = window.scrollY;

        document.body.style.position = 'fixed';
        document.body.style.overflow = 'hidden'; //Prevent scrolling page
        this.isOpen = true;
    }

    /**
     * Hide gallery
     */
    hideGallery() {
        this.hidePreview();
        hideEl(this.elements.frame);
        document.body.style.position = prevBodyPosition;
        document.body.style.overflow = prevBodyOverflow;
        window.scrollTo(prevScroll.x, prevScroll.y);
        if (window.location.href.indexOf(AUTO_OPEN_PARAM) !== -1) {
            window.history.replaceState(
                {},
                window.title,
                window.location.href.replace(AUTO_OPEN_PARAM, '')
            );
        }
        this.isOpen = false;
    }

    /**
     * Change preview image
     * @param  {Number} direction -1 for back, 1 for forward
     */
    changePreviewImage(direction) {
        let el =
            direction === 1
                ? this.elements.preview.img._galleryzerImageEl.nextSibling
                : this.elements.preview.img._galleryzerImageEl.previousSibling;
        if (!el) {
            // First or last element, loop to the other end
            el =
                direction === 1
                    ? this.elements.content.firstChild
                    : this.elements.content.lastChild;
        }

        if (el) {
            this.hidePreview();
            el.dispatchEvent(new Event('click', { bubbles: true }));
        }
    }

    /**
     * Set preview text
     * @param {HTMLElement} img
     */
    changePreviewText(img) {
        while (this.elements.preview.textContext.lastChild) {
            this.elements.preview.textContext.removeChild(
                this.elements.preview.textContext.lastChild
            ); // Clear text context box
        }

        let textContent;

        if (img._galleryzedTextContent) {
            textContent = img._galleryzedTextContent;
        } else {
            // Find context text for image
            let textContentNode =
                img.parentNode.tagName === 'A' ? img.parentNode.parentNode : img.parentNode;
            let treeWalker = document.createTreeWalker(textContentNode, NodeFilter.SHOW_TEXT, {
                acceptNode: function (node) {
                    const nodeData = node.data.trim();
                    if (
                        nodeData.length &&
                        nodeData.indexOf('This image has been resized.') === -1
                    ) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                },
            });

            textContent = document.createDocumentFragment();

            while (treeWalker.nextNode()) {
                const textEl = document.createElement('p');
                textEl.textContent = treeWalker.currentNode.data;
                textContent.appendChild(textEl);
            }
            img._galleryzedTextContent = textContent;
        }

        if (textContent.hasChildNodes()) {
            this.elements.preview.textContext.appendChild(textContent.cloneNode(true));
            showEl(this.elements.preview.textContext);
        } else {
            hideEl(this.elements.preview.textContext);
        }
    }

    /**
     * Bind event listeners for gallery functions
     */
    bindEventListeners() {
        //Close gallery or preview when esc is clicked
        document.addEventListener(
            'keyup',
            (event) => {
                if (event.key === KEY_ESC) {
                    if (this.isPreviewOpen) {
                        this.hidePreview();
                        return false;
                    } else if (this.isOpen) {
                        this.hideGallery();
                        return false;
                    }
                } else if (this.isPreviewOpen && event.key === KEY_RIGHT_ARROW) {
                    this.changePreviewImage(1);
                } else if (this.isPreviewOpen && event.key === KEY_LEFT_ARROW) {
                    this.changePreviewImage(-1);
                }
            },
            false
        );

        //Close gallery when you click the transparent area outside it
        this.elements.frame.addEventListener(
            'click',
            () => {
                this.hideGallery();
            },
            false
        );

        //Close gallery when you click the close button
        this.elements.closeButton.addEventListener(
            'click',
            () => {
                this.hideGallery();
            },
            false
        );

        //Prevent event bubbling beyond container
        this.elements.container.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        //Hide preview when clicking the transparent background
        this.elements.bg.addEventListener(
            'click',
            (event) => {
                event.stopPropagation();
                this.hidePreview();
            },
            false
        );

        //Close big image by clicking preview image
        this.elements.preview.container.addEventListener(
            'click',
            (event) => {
                event.stopPropagation();
                this.hidePreview();
            },
            false
        );

        //Big image load event
        this.elements.preview.img.addEventListener(
            'load',
            () => {
                if (this.elements.preview.img.complete) {
                    this.elements.preview.container.style.width = 'auto';
                    this.elements.preview.container.style.height = 'auto';

                    this.elements.preview.img._galleryzed = true;

                    this.elements.preview.className = '';
                    hideEl(this.elements.preview.spinner);
                    showEl(this.elements.preview.img);
                }
            },
            false
        );

        //Error loading image, show thumbnail
        this.elements.preview.img.addEventListener(
            'error',
            () => {
                if (this.elements.preview.img.getAttribute('src') !== this.previewAltImgURL) {
                    this.elements.preview.img.setAttribute('src', this.previewAltImgURL);

                    hideEl(this.elements.preview.spinner);
                    showEl(this.elements.preview.img);
                }
            },
            false
        );

        //Click event to show bigger image
        this.elements.content.addEventListener(
            'click',
            (event) => {
                event.stopPropagation();
                var target = event.target;

                if (target.className !== GALLERY_IMAGE_CLASS) {
                    if (target.parentNode.className === GALLERY_IMAGE_CLASS) {
                        target = target.parentNode;
                    } else {
                        return false;
                    }
                }

                if (!this.isPreviewOpen) {
                    let imgURL = target.getAttribute('data-bigImage');
                    this.previewAltImgURL = target.querySelector('img').getAttribute('src');

                    if (!imgURL) {
                        imgURL = this.previewAltImgURL;
                    }

                    if (imgURL !== this.elements.preview.img.getAttribute('src')) {
                        this.elements.preview.container.className = 'loading';
                        hideEl(this.elements.preview.img);
                        showEl(this.elements.preview.spinner);
                        this.elements.preview.img.setAttribute('src', imgURL);
                        this.elements.preview.img._galleryzerImageEl = target;
                        this.changePreviewText(target._galleryzedOriginalImgNode);
                    }

                    this.showPreview();
                }
            },
            false
        );
    }

    setupFormNav() {
        if (!this.settings.findForumNav) return;

        this.elements.forumNav = findForumNav();
        if (this.elements.forumNav) {
            buildForumNav(this.elements.container, this.elements.forumNav);
        }
    }

    /**
     * Build gallery frame
     * @return {HTMLElement}
     */
    buildFrame() {
        let el = document.createElement('div');
        el.setAttribute('id', FRAME_ID);
        el.className = this.settings.background;
        el.innerHTML = `
        <div id="${PREFIX}background"></div>
        <div id="${PREFIX}preview">
            <div class="${PREFIX}loader"></div>
            <img id="${PREFIX}preview_image">
            <div id="${PREFIX}preview_text"></div>
        </div>
        <div id="${PREFIX}container">
            <div id="${PREFIX}close_button">X</div>
            <div id="${PREFIX}notification_container"></div>
            <div id="${PREFIX}wrapper">
                <div id="${PREFIX}content"></div>
            </div>
        </div>`;
        return el;
    }

    /**
     * Build and set gallery elements
     */
    buildGallery() {
        if (this.elements.frame) {
            return; //Can only be run once
        }

        this.elements.frame = this.buildFrame();

        document.body.appendChild(this.elements.frame);

        this.elements.container = this.elements.frame.querySelector(`#${PREFIX}container`);
        this.elements.content = this.elements.container.querySelector(`#${PREFIX}content`);
        this.elements.preview.container = this.elements.frame.querySelector(`#${PREFIX}preview`);
        this.elements.preview.img = this.elements.preview.container.querySelector(
            `#${PREFIX}preview_image`
        );
        this.elements.preview.textContext = this.elements.preview.container.querySelector(
            `#${PREFIX}preview_text`
        );
        this.elements.preview.spinner = this.elements.preview.container.querySelector(
            `.${PREFIX}loader`
        );

        this.elements.bg = this.elements.frame.querySelector(`#${PREFIX}background`);
        this.elements.closeButton = this.elements.container.querySelector(`#${PREFIX}close_button`);
    }
}
