'use strict';
const gulp = require('gulp');
const minify = require('gulp-minify');
const tar = require('gulp-tar');
const untar = require('gulp-untar');
const gzip = require('gulp-gzip');
const gunzip = require('gulp-gunzip');
const del = require('del');
const jsdoc = require('gulp-jsdoc3');
const prettierEslint = require('gulp-prettier-eslint');
const eslint = require('gulp-eslint');
const merge = require('merge-stream');

const copied = false;
/**
 * Gulp task for prettifying code.
 */
gulp.task('prettify-eslint', async () => {
    gulp.src('lib/**/*.js')
        .pipe(prettierEslint())
        .pipe(gulp.dest('./lib'));
    gulp.src('spec/**/*.js')
        .pipe(prettierEslint())
        .pipe(gulp.dest('./spec'));
    gulp.src('.gulpfile.js')
        .pipe(prettierEslint())
        .pipe(gulp.dest('.'));
});
/**
 * Gulp task for linting code with eslint.
 */
gulp.task('lint-eslint', () => {
    return gulp
        .src(['lib/**/*.js', 'spec/**/*.js', 'gulpfile.js', '.eslintrc.json'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('clean_source', async () => {
    await del(['source', 'atom-path-intellisense.source.tar.gz']);
});

gulp.task('copy_source', async (done) => {
    gulp.src(['assets/**']).pipe(gulp.dest('source/assets'));
    gulp.src(['lib/**']).pipe(gulp.dest('source/lib'));
    gulp.src(['spec/**']).pipe(gulp.dest('source/spec'));
    gulp.src(['styles/**']).pipe(gulp.dest('source/styles'));
    done();
});

gulp.task('tar_source', async () => {

    await gulp.src('source/**/*')
        .pipe(tar('atom-path-intellisense.source.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('.'));
});

gulp.task(
    'backup_source',
    gulp.series(['clean_source', 'copy_source', 'tar_source'])
);
