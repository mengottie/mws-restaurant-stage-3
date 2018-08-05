const gulp = require('gulp');
const sass = require('gulp-sass');
const runSequence = require('run-sequence');
const autoprefixer = require('gulp-autoprefixer');
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine-phantom');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const workbox = require('workbox-build');
const del = require('del');
const imagemin = require('imagemin');
const imageminWep = require('imagemin-webp');
const webp = require('gulp-webp');
const babel = require('gulp-babel');
const $ = require('gulp-load-plugins')();

const paths = {
  srcHtml: ['src/*.html','manifest.json'],
  srcJs: ['src/js/*.js','node_modules/idb/lib/idb.js'],
  srcSw: 'src/sw',
  srcSass: 'src/sass/**/*.scss',
  srcIcons: 'src/img/icons/*.png',
  srcRespImages: 'src/img/*.jpg',
  destRespImages: 'dist/img',
  destHtml: 'dist',
  destJs: 'dist/js',
  destSw: 'dist',
  destCss: 'dist/css',
  destIcons: 'dist/img/icons'
};

gulp.task('default', ['copy-html', 'copy-js', 'styles'], function () {
  gulp.watch(paths.srcSass, ['styles', 'workbox-build-sw']);
  gulp.watch(paths.srcHtml, ['copy-html','workbox-build-sw']);
  gulp.watch(paths.srcJs, ['copy-js', 'workbox-build-sw']);
  gulp.watch(paths.srcSw, ['copy-sw','workbox-build-sw']);
});

gulp.task('dist', function(c){
  runSequence(
    'clean-all-dist',
    'images-resize-responsive',
    'copy-html',
    'copy-js',
    'styles',
    'copy-icons',
    'workbox-build-sw',
    c
  );
});

gulp.task('make', function(c){
  runSequence(
    'copy-html',
    'copy-js',
    'styles',
    'copy-icons',
    'workbox-build-sw',
    c
  );
});

gulp.task('copy-html', function () {
  gulp.src(paths.srcHtml)
    .pipe(gulp.dest(paths.destHtml));
});

gulp.task('copy-js', function () {
  gulp.src(paths.srcJs)
    .pipe(gulp.dest(paths.destJs));
});

/* gulp.task('copy-sw', function () {
  gulp.src(paths.srcSw)
    .pipe(gulp.dest(paths.destSw));
}); */

gulp.task('copy-icons', function () {
  gulp.src(paths.srcIcons)
    .pipe(gulp.dest(paths.destIcons));
});

gulp.task('styles', function () {
  gulp.src(paths.srcSass)
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest(paths.destCss));
  /* .pipe(browserSync.stream()); */
});


gulp.task('lint', function () {
  return gulp.src([paths.srcJs, paths.srcSw])
    // eslint() attaches the lint output to the eslint property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failOnError last.
    .pipe(eslint.failOnError());
});


// Create responsive images.
// https://github.com/mahnunchik/gulp-responsive/blob/HEAD/examples/multiple-resolutions.md
gulp.task('images-resize-responsive', function () {
  return gulp.src(paths.srcRespImages)
    .pipe($.responsive({
      // Resize all JPG images to three different sizes: 200, 500, and 630 pixels
      '*.jpg': [{
        width: 400,
        rename: { suffix: '-400px' },
      }, {
        width: 600,
        rename: { suffix: '-600px' },
      }, {
        width: 800,
        rename: { suffix: '-800px' },
      }]
    }, {
      // Global configuration for all images
      // The output quality for JPEG, WebP and TIFF output formats
      quality: 70,
      // Use progressive (interlace) scan for JPEG and PNG output
      progressive: true,
      // Strip all metadata
      withMetadata: false,
    }))
    .pipe(gulp.dest(paths.destRespImages));
});

gulp.task('clean-all-dist', function(){
  del.sync(paths.destJs);
  del.sync(paths.destRespImages);
  del.sync(paths.destCss);
});

gulp.task('clean-code', function(){
  del.sync(paths.destJs);
  del.sync(paths.destCss);
});

gulp.task('workbox-build-sw', function(){
  return workbox.injectManifest({
    globDirectory: 'dist',
    globPatterns: [
      '*.html',
      'css/*.css',
      'js/*.js',
      '*.json',
    ],
    globIgnores: [
      'node_modules/**/*'
    ],
    swDest: `${paths.destSw}/sw.js`,
    swSrc: `${paths.srcSw}/sw.js`,
  }).then(({warnings}) => {
    // In case there are any warnings from workbox-build, log them.
    for (const warning of warnings) {
      console.warn(warning);
    }
    console.info('Service worker generation completed.');
  }).catch((error) => {
    console.warn('Service worker generation failed:', error);
  });
});