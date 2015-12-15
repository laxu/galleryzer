//Run when clicking toolbar icon
buildGallery(); //Create gallery

if(document.images.length) {
	if(galleryOpen) {
		hideGallery();
	}
	else {
        if(getImages()) {
            showGallery();    
        } else {
            notify('No suitable images found.');
        }
	}	
}
