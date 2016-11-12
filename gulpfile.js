'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const path = require('path');
const pump = require('pump');
const eslint = require('gulp-eslint');

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

gulp.task('js', function(callback) {
  pump(
    [
      gulp.src(paths.contentScript),
      concat('galleryzer.js'),
      eslint(),
      eslint.format(),
      eslint.failAfterError(),
      babel({
        compact: false,
        presets: ['es2015']
      }),
      gulp.dest(paths.dist)
    ],
    callback
  );
});

gulp.task('js:misc', function(callback) {
  pump(
    [
      gulp.src(paths.miscJs),
      gulp.dest(paths.dist)
    ],
    callback
  );
});

gulp.task('js:watch', function() {
  gulp.watch(paths.contentScript, ['js']);
  gulp.watch(paths.miscJs, ['js:misc']);
});

gulp.task('js:uglify', ['js', 'js:misc'], function(callback) {
  pump(
    [
      gulp.src(path.join(paths.dist, '**/*.js')),
      uglify(),
      gulp.dest(paths.dist)
    ],
    callback
  );
});

gulp.task('sass', function(callback) {
  pump(
    [
      gulp.src(paths.sass),
      sass(),
      gulp.dest(paths.dist)
    ], 
    callback
  );
});

gulp.task('optimize:css', ['sass'], function(callback) {
  pump(
    [
      gulp.src(path.join(paths.dist, '*.css')),
      cssnano({ safe: true }),
      gulp.dest(paths.dist)
    ], callback
  );
});

gulp.task('sass:watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('copy:images', function(callback) {
  pump(
    [
      gulp.src(paths.images),
      gulp.dest(path.join(paths.dist, 'images'))
    ],
    callback
  );
});

gulp.task('copy:misc', function(callback) {
  pump(
    [
      gulp.src([paths.html, paths.manifest]),
      gulp.dest(paths.dist)
    ],
    callback
  );
});

gulp.task('dev', ['build:dev', 'js:watch', 'sass:watch']);
gulp.task('build:dev', ['js', 'js:misc', 'sass', 'copy:misc', 'copy:images']);
gulp.task('build:prod', ['js', 'js:misc', 'sass', 'copy:misc', 'copy:images', 'js:uglify', 'optimize:css']);

gulp.task('default', ['dev']);