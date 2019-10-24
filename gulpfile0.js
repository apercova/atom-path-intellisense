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

gulp.task('tar_source', function() {
    return gulp
        .src('src/**/*')
        .pipe(tar('atom-path-intellisense.source.tar'))
        .pipe(gzip())
        .pipe(gulp.dest('.'));
});

gulp.task('untar_source', function() {
    return gulp
        .src('atom-path-intellisense.source.tar.gz')
        .pipe(gunzip())
        .pipe(untar())
        .pipe(gulp.dest('src'));
});

gulp.task('clean_source', async function() {
    await del(['src']);
});

gulp.task('clean_dist', async function() {
    await del(['assets']);
    await del(['lib']);
    await del(['spec']);
    await del(['styles']);
});

gulp.task('clean_docs', async function() {
    await del(['docs']);
});

gulp.task('gen_docs', function(cb) {
    return gulp
        .src(['README.md', './src/lib/**/*.js'], { read: false })
        .pipe(jsdoc(cb));
});

gulp.task('minify_source', function() {
    return gulp
        .src(['src/lib/**/*.js'], { allowEmpty: true })
        .pipe(
            minify({
                noSource: true,
                ext: {
                    src: '.js',
                    min: '.js'
                }
            })
        )
        .pipe(gulp.dest('lib/'));
});

gulp.task('minify_specs', function() {
    return gulp
        .src(['src/spec/**/*.js'], { allowEmpty: true })
        .pipe(
            minify({
                noSource: true,
                ext: {
                    src: '.js',
                    min: '.js'
                }
            })
        )
        .pipe(gulp.dest('spec/'));
});

gulp.task('copy_lib_to_source', async function() {
    await del(['src']);
    await gulp.src('lib/**/*').pipe(gulp.dest('src/lib/'));
    await gulp.src('spec/**/*').pipe(gulp.dest('src/spec/'));
    await gulp.src('styles/**/*').pipe(gulp.dest('src/styles/'));
});

gulp.task('copy_source_to_dist', async function() {
    await gulp.src('src/assets/**/*').pipe(gulp.dest('assets/'));
    await gulp.src('src/lib/**/*').pipe(gulp.dest('lib/'));
    await gulp.src('src/spec/**/*').pipe(gulp.dest('spec/'));
    await gulp.src('src/styles/**/*').pipe(gulp.dest('styles/'));
});

gulp.task('docs', gulp.series(['clean_docs', 'gen_docs']));

gulp.task('prettify-eslint', async () => {
    gulp.src('lib/**/*.js')
        .pipe(prettierEslint())
        .pipe(gulp.dest('./lib'));
});

gulp.task('minify', gulp.series(['minify_source', 'minify_specs']));

gulp.task(
    'restore_source',
    gulp.series([
        'clean_dist',
        'clean_source',
        'untar_source',
        'copy_source_to_dist'
    ])
);

gulp.task(
    'prepare_release',
    gulp.series(['tar_source', 'minify', 'clean_source', 'clean_docs'])
);
