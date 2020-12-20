import Gallery from './galleryzer';
import { getSettings } from './helpers';

let Galleryzer;

/* eslint-disable-next-line no-undef */
chrome.runtime.onMessage.addListener(function (request) {
    if (!request.toggleGalleryzer) return;

    if (!Galleryzer || !Galleryzer.initialized) {
        // Initialize Galleryzer
        getSettings((settings) => {
            Galleryzer = new Gallery(settings);
            Galleryzer.openGallery();
        });
    } else {
        // Toggle Galleryzer open or closed
        Galleryzer.toggleGallery();
    }
});
