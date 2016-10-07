'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var path = require('path');
var pump = require('pump');

var rootPath = path.resolve(__dirname) + '/src/';

var paths = {
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