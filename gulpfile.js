const { src, dest, parallel, series, watch } = require('gulp');
const fileInclude = require('gulp-file-include');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const fs = require('fs');

// Пути
const paths = {
  src: {
    html: 'src/html/**/*.html',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    img: 'src/img/**/*.{jpg,jpeg,png,gif,svg,webp}'
  },
  dist: {
    base: 'dist/',
    html: 'dist/',
    css: 'dist/css/',
    js: 'dist/js/',
    img: 'dist/img/'
  }
};

// Очистка dist (исправленная версия)
function clean() {
  if (fs.existsSync(paths.dist.base)) {
    fs.rmSync(paths.dist.base, { recursive: true, force: true });
  }
  return Promise.resolve();
}

// HTML
function html() {
  return src(paths.src.html)
    .pipe(plumber())
    .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(dest(paths.dist.html))
    .pipe(browserSync.stream());
}

// SCSS
function styles() {
  if (!fs.existsSync(paths.dist.css)) {
    fs.mkdirSync(paths.dist.css, { recursive: true });
  }

  return src(paths.src.scss)
    .pipe(plumber({
      errorHandler: notify.onError({
        title: "SCSS Error",
        message: "<%= error.message %>",
        sound: false
      })
    }))
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(paths.dist.css))
    .pipe(browserSync.stream({ match: '**/*.css' }));
}

// JavaScript
function scripts() {
  return src(paths.src.js)
    .pipe(dest(paths.dist.js))
    .pipe(browserSync.stream());
}

// Изображения
function images() {
  return src(paths.src.img)
    .pipe(dest(paths.dist.img))
    .pipe(browserSync.stream());
}

// Сервер
function serve() {
  browserSync.init({
    server: {
      baseDir: paths.dist.base,
      serveStaticOptions: {
        extensions: ['html']
      }
    },
    notify: false,
    open: true
  });

  watch(paths.src.html, html).on('change', browserSync.reload);
  watch(paths.src.scss, styles);
  watch(paths.src.js, scripts);
  watch(paths.src.img, images);
}

// Сборка
const build = series(clean, parallel(html, styles, scripts, images));

// Экспорт задач
exports.clean = clean;
exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.build = build;
exports.default = series(build, serve);