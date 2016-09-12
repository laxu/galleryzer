if(document.images.length) {
    if(galleryOpen) {
        hideGallery();
    } else {
        if(!settings) {
            getSettings(initGallery);
        } else {
            initGallery();
        }
    }
} else {
    notify('No images on page.')
}
