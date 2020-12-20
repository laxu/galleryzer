export const PREFIX = 'galleryzer_'; //Prefix to avoid clashing classes etc
export const GALLERY_IMAGE_CLASS = PREFIX + 'gallery_image';
export const FRAME_ID = PREFIX + 'frame';

export const AUTO_OPEN_PARAM = 'galleryzerAutoOpen=1';

export const NOTIFICATION_CLOSE_DELAY = 3000;
export const NOTIFICATION_FADE_DELAY = 1000;

export const IMAGE_HEIGHT_RATIO = 1.5; // Value to determine if image is tall enough (to skip header images, banners etc)

export const RENDER_DELAY = 100;
export const FADE_IN_DELAY = 400;
export const NO_IMAGES_FOUND_WAIT_DELAY = 4000;

// Forum navigation container elements
export const FORUM_NAV_ELEMENTS =
    '.pagenav, .pageNav-main, .PageNav, .pagelinks, .paging, .pagination, .gensmall';
// Forum nav elements containing link to next page
export const FORUM_NAV_LINK_ELEMENTS = 'a, td > span > strong, li > span';

// Forum navigation classes indicating currently selected page
export const FORUM_CURRENT_PAGE_CLASSES = [
    'currentPage',
    'current',
    'alt2',
    'active',
    'pageNav-page--current',
];

//Keyboard keycodes used
export const KEY_ESC = 'Escape';
export const KEY_RIGHT_ARROW = 'ArrowRight';
export const KEY_LEFT_ARROW = 'ArrowLeft';
