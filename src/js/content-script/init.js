var PREFIX = 'galleryzer_',      //Prefix to avoid clashing classes etc
    galleryImageClass = PREFIX + 'gallery_image',

    frameID = PREFIX + 'gallery_frame',

    //Elements will be referenced with these
    frame, container, content, bg, closeButton,
    preview, previewImg, previewSpinner, previewTextContext, notifications,

    imgURL, altImgURL,  //Current image preview URLs

    prevBodyPosition,               //Used for saving previous body position state
    prevBodyOverflow,               //Used for saving previous body overflow state
    prevScroll = { x: 0, y: 0 },    //Used for saving previous scroll position
    
    images = [],                    //Images suitable for gallery
    allImageSrcList = [],           //List of all image sources to prevent duplicates

    settings,

    //Keyboard keycodes used
    KEY_ESC         = 27,
    KEY_RIGHT_ARROW = 39,
    KEY_LEFT_ARROW  = 37,

    previewOpen = false, 
    galleryOpen = false,
    contentChanged = false,

    previewPadding = 20,    //Image preview container padding
    imgScaleRatio  = 2.5,    //Image scaling ratio
    imgHeightRatio = 1.5,   //Value to determine if image is tall enough (to skip header images, banners etc)
    desiredHeight,
    
    renderTimer,
    RENDER_DELAY = 100,
    FADE_IN_DELAY = 400,
    NO_IMAGES_FOUND_WAIT_DELAY = 4000,
    NOTIFICATION_CLOSE_DELAY = 3000,
    NOTIFICATION_FADE_DELAY = 1000,

    forumNav,
    forumNavWrapper,
    forumNavElements = '.pagenav, .PageNav, .pagelinks, .paging, .pagination',
    FORUM_SMF = 'SMF',
    FORUM_XENFORO = 'xenforo',
    FORUM_VB = 'vBulletin',
    AUTO_OPEN_PARAM = 'galleryzerAutoOpen=1';