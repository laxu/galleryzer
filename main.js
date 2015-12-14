
//Run when clicking toolbar icon
buildGallery(); //Create gallery of suitable images

if(document.images.length)
{
	if(galleryOpen) {
		hideGallery();
	}
	else {
        getImages();
		showGallery();	
	}	
}	