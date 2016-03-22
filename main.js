console.log('running');
/**
 * Initialize gallery
 */
function initGallery() {
    desiredHeight = settings.minWidth / imgHeightRatio;
    buildGallery();
    getImages()
    //createImages();
    console.log('images', images.length);
    showGallery();
}

if(document.images.length) {
    
	if(galleryOpen) {
		hideGallery();
	}
	else {
        if(!settings) {
            getSettings(initGallery);
        }
        else {
            initGallery();
        }
        
	}	
} else {
    notify('No images on page.')
}
