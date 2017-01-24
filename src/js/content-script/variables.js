'use strict';

const PREFIX = 'galleryzer_';      //Prefix to avoid clashing classes etc
const galleryImageClass = PREFIX + 'gallery_image';
const frameID = PREFIX + 'frame';

const AUTO_OPEN_PARAM = 'galleryzerAutoOpen=1';

const NOTIFICATION_CLOSE_DELAY = 3000;
const NOTIFICATION_FADE_DELAY = 1000;

const RENDER_DELAY = 100;
const FADE_IN_DELAY = 400;
const NO_IMAGES_FOUND_WAIT_DELAY = 4000;

const FORUM_NAV_ELEMENTS = '.pagenav, .PageNav, .pagelinks, .paging, .pagination, .gensmall';
const FORUM_NAV_LINK_ELEMENTS = 'a, td > span > strong, li > span';
const FORUM_CURRENT_PAGE_CLASSES = ['currentPage', 'current', 'alt2', 'active'];

//Keyboard keycodes used
const KEY_ESC         = 27;
const KEY_RIGHT_ARROW = 39;
const KEY_LEFT_ARROW  = 37;

let renderTimer;
let images = [];                    // Images suitable for gallery
let allImageSrcList = [];           // List of all image sources to prevent duplicates

//Elements will be referenced with these
let frame;
let container;
let content;
let bg;
let closeButton;
let preview;
let previewImg;
let previewSpinner;
let previewTextContext;
let notifications;
let forumNav;

let settings;                       // Settings from chrome options will be loaded here

let altImgURL;                      // Current image preview URL

let prevBodyPosition;               // Used for saving previous body position state
let prevBodyOverflow;               // Used for saving previous body overflow state
let prevScroll = { x: 0, y: 0 };    // Used for saving previous scroll position

let previewOpen = false;
let galleryOpen = false;

let imgHeightRatio = 1.5;   // Value to determine if image is tall enough (to skip header images, banners etc)
let desiredHeight;
