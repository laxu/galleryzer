//Run when clicking toolbar icon

if(document.images.length) {
	if(galleryOpen) {
		hideGallery();
	}
	else {
        if(getImages()) {
            buildGallery();
            createImages();
            showGallery();    
        } else {
            notify('No suitable images found.');
        }
	}	
}
