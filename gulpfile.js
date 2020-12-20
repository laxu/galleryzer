'use strict';

const { series, parallel, watch, src, dest } = require('gulp');
const sass = require('@selfisekai/gulp-sass');
const composer = require('gulp-uglify/composer');
const uglifyJS = require('uglify-es');
const cssnano = require('gulp-cssnano');
const path = require('path');
const pump = require('pump');
const eslint = require('gulp-eslint');
const cleanDir = require('gulp-clean-dir');
const rollup = require('gulp-rollup');
const rename = require('gulp-rename');
sass.compiler = require('sass');
const minify = composer(uglifyJS, console);

const srcPath = path.resolve(__dirname, 'src/');

const paths = {
    dist: path.resolve(__dirname, 'dist/'),
    miscJs: [path.resolve(srcPath, 'js/options.js'), path.resolve(srcPath, 'js/background.js')],
    contentScript: path.resolve(srcPath, 'js/content-script/**.js'),
    contentScriptEntry: path.resolve(srcPath, 'js/content-script/index.js'),
    sass: path.resolve(srcPath, 'sass/**/*.scss'),
    html: path.resolve(srcPath, 'html/*.html'),
    images: path.resolve(srcPath, 'images/*.png'),
    manifest: path.resolve(srcPath, 'manifest.json'),
};

function cleanDist(callback) {
    cleanDir(paths.dist);
    callback();
}

function compileJS(callback) {
    pump(
        [
            src(paths.contentScript),
            eslint.format(),
            eslint.failAfterError(),
            rollup({
                input: paths.contentScriptEntry,
                output: {
                    format: 'cjs',
                },
            }),
            rename('galleryzer.js'),
            dest(paths.dist),
        ],
        callback
    );
}

function copyMiscJS(callback) {
    pump([src(paths.miscJs), dest(paths.dist)], callback);
}

const minifyJS = series(compileJS, copyMiscJS, function uglifyJS(callback) {
    pump([src(path.join(paths.dist, '**/*.js')), minify(), dest(paths.dist)], callback);
});

function compileSASS(callback) {
    pump([src(paths.sass), sass(), dest(paths.dist)], callback);
}

const optimizeStyles = series(compileSASS, function optimizeCSS(callback) {
    pump(
        [src(path.join(paths.dist, '*.css')), cssnano({ safe: true }), dest(paths.dist)],
        callback
    );
});

function copyImages(callback) {
    pump([src(paths.images), dest(path.join(paths.dist, 'images'))], callback);
}

function copyMisc(callback) {
    pump([src([paths.html, paths.manifest]), dest(paths.dist)], callback);
}

function watchJS() {
    watch(paths.contentScript, compileJS);
    watch(paths.miscJs, copyMiscJS);
}

function watchSASS() {
    watch(paths.sass, compileSASS);
}

const buildDev = series(
    cleanDist,
    parallel(compileJS, copyMiscJS, compileSASS, copyMisc, copyImages)
);

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
