'use strict';

const { series, parallel, watch, src, dest } = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const sass = require('@selfisekai/gulp-sass');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const path = require('path');
const pump = require('pump');
const eslint = require('gulp-eslint');
const cleanDir = require('gulp-clean-dir');
sass.compiler = require('sass');

const rootPath = path.resolve(__dirname) + '/src/';

const paths = {
  dist: path.resolve(__dirname, 'dist/'),
  miscJs: [
    path.resolve(rootPath, 'js/main.js'),
    path.resolve(rootPath, 'js/options.js'),
    path.resolve(rootPath, 'js/background.js'),
  ],
  contentScript: [
    path.resolve(rootPath, 'js/content-script/variables.js'),
    path.resolve(rootPath, 'js/content-script/galleryzer.js'),
    path.resolve(rootPath, 'js/content-script/helpers.js'),
    path.resolve(rootPath, 'js/content-script/process.js'),
    path.resolve(rootPath, 'js/content-script/forumNav.js')
  ],
  sass: path.resolve(rootPath, 'sass/**/*.scss'),
  html: path.resolve(rootPath, 'html/*.html'),
  images: path.resolve(rootPath, 'images/*.png'),
  manifest: path.resolve(rootPath, 'manifest.json')
};

function cleanDist(callback) {
  cleanDir(paths.dist);
  callback();
}

function compileJS(callback) {
  pump(
    [
      src(paths.contentScript),
      concat('galleryzer.js'),
      eslint(),
      eslint.format(),
      eslint.failAfterError(),
      babel({
        compact: false,
        presets: ['@babel/preset-env']
      }),
      dest(paths.dist)
    ],
    callback
  );
}

function copyMiscJS(callback) {
  pump(
    [
      src(paths.miscJs),
      dest(paths.dist)
    ],
    callback
  );
}

const minifyJS = series(compileJS, copyMiscJS, function uglifyJS(callback) {
  pump(
    [
      src(path.join(paths.dist, '**/*.js')),
      uglify(),
      dest(paths.dist)
    ],
    callback
  );
});

function compileSASS(callback) {
  pump(
    [
      src(paths.sass),
      sass(),
      dest(paths.dist)
    ], 
    callback
  );
}

const optimizeStyles = series(compileSASS, function optimizeCSS(callback) {
  pump(
    [
      src(path.join(paths.dist, '*.css')),
      cssnano({ safe: true }),
      dest(paths.dist)
    ], callback
  );
});

function copyImages(callback) {
  pump(
    [
      src(paths.images),
      dest(path.join(paths.dist, 'images'))
    ],
    callback
  );
}

function copyMisc(callback) {
  pump(
    [
      src([paths.html, paths.manifest]),
      dest(paths.dist)
    ],
    callback
  );
}

function watchJS() {
  watch(paths.contentScript, compileJS);
  watch(paths.miscJs, copyMiscJS);
}

function watchSASS() {
  watch(paths.sass, compileSASS);
};

const buildDev = series(cleanDist, parallel(compileJS, copyMiscJS, compileSASS, copyMisc, copyImages));

exports.buildDev = buildDev;

exports.buildProd = series(
  cleanDist,
  parallel(compileJS, copyMiscJS, compileSASS, copyMisc, copyImages),
  parallel(minifyJS, optimizeStyles)
);

exports.default = series(buildDev, function startWatchers() {
  watchJS();
  watchSASS();
});
