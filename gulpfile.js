'use strict';
/**
 *
 * @description Gulp configuration file.
 * @author
 *  [{@link https://github.com/apercova|github@apercova}],
 *  [{@link https://twitter.com/apercova|twitter@apercova}],
 *  [{@link https://www.npmjs.com/~apercova|npmjs/~apercova}]
 *
 * @since 1.2.0
 */
const del = require('del'),
  gulp = require('gulp'),
  eslint = require('gulp-eslint'),
  gunzip = require('gulp-gunzip'),
  gzip = require('gulp-gzip'),
  jsdoc = require('gulp-jsdoc3'),
  minify = require('gulp-minify'),
  prettierEslint = require('gulp-prettier-eslint'),
  tar = require('gulp-tar'),
  untar = require('gulp-untar');

/**
 * Task for generate docs.
 */
gulp.task('docs', cb => {
  del('docs/**');
  const config = require('./jsdoc.json');
  gulp.src(['README.md', './lib/**/*.js'], { 'read': true }).pipe(jsdoc(config, cb));
});

/**
 * Task for backup source files.
 */
gulp.task('source:backup', () => {
  return gulp
    .src(['**', '!.git/**', '!.docs/**', '!node_modules/**', '!atom-path-intellisense-source.tar.gz'])
    .pipe(tar('atom-path-intellisense-source.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('.'));
});

/**
 * Task for prettify source files.
 */
gulp.task('source:prettify', () => {
  gulp
    .src('lib/**/*.js')
    .pipe(prettierEslint())
    .pipe(gulp.dest('./lib'));
  gulp
    .src('spec/**/*.js')
    .pipe(prettierEslint())
    .pipe(gulp.dest('./spec'));
  return gulp
    .src('gulpfile.js')
    .pipe(prettierEslint())
    .pipe(gulp.dest('.'));
});

/**
 * Task for lint source files with eslint.
 */
gulp.task('source:lint', () => {
  return gulp
    .src(['lib/**/*.js', 'spec/**/*.js', 'gulpfile.js', '.eslintrc.json'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

/**
 * Task for minify source files.
 */
gulp.task('source:minify', () => {
  gulp
    .src(['spec/**/*.js'], { 'allowEmpty': true })
    .pipe(
      minify({
        'noSource': true,
        'ext': {
          'src': '.js',
          'min': '.js'
        }
      })
    )
    .pipe(gulp.dest('spec/'));
  return gulp
    .src(['lib/**/*.js'], { 'allowEmpty': true })
    .pipe(
      minify({
        'noSource': true,
        'ext': {
          'src': '.js',
          'min': '.js'
        }
      })
    )
    .pipe(gulp.dest('lib/'));
});

/**
 * Task for restore source files from tarball.
 */
gulp.task('source:restore', function() {
  del(['**', '!.git/**', '!.docs/**', '!node_modules/**', '!atom-path-intellisense-source.tar.gz']);
  return gulp
    .src('atom-path-intellisense-source.tar.gz')
    .pipe(gunzip())
    .pipe(untar())
    .pipe(gulp.dest('.'));
});

/**
 * Task for prepare release artifacts.
 */
gulp.task('release:prepare', gulp.series(['source:lint', 'source:prettify', 'docs']));
