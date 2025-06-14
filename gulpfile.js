const { src, dest, parallel, series, watch } = require('gulp');
const fileInclude = require('gulp-file-include');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const { deleteSync } = require('del');
const fs = require('fs');
const plumber = require('gulp-plumber'); // NEW
const notify = require('gulp-notify'); // NEW

// Пути
const paths = {
  src: {
    html: 'src/html/**/*.html',
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    img: 'src/img/**/*.{jpg,jpeg,png,gif,svg}'
  },
  dist: {
    base: 'dist/',
    html: 'dist/',
    css: 'dist/css/',
    js: 'dist/js/',
    img: 'dist/img/'
  }
};

// Очистка dist
function clean() {
  return deleteSync([paths.dist.base]); // NEW: более надежный способ
}

// HTML
function html() {
  return src(paths.src.html)
    .pipe(plumber()) // NEW: обработка ошибок
    .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file',
      context: {
        env: process.env.NODE_ENV
      }
    }))
    .pipe(dest(paths.dist.html))
    .pipe(browserSync.stream()); // NEW: автообновление HTML
}

// SCSS
function styles() {
  if (!fs.existsSync(paths.dist.css)) {
    fs.mkdirSync(paths.dist.css, { recursive: true });
  }

  return src(paths.src.scss, { sourcemaps: true }) // NEW: добавлены sourcemaps
    .pipe(plumber({ // NEW: улучшенная обработка ошибок
      errorHandler: notify.onError({
        title: "SCSS Error",
        message: "<%= error.message %>",
        sound: false
      })
    }))
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(paths.dist.css, { sourcemaps: '.' })) // NEW: sourcemaps
    .pipe(browserSync.stream({ match: '**/*.css' })); // NEW: автообновление CSS
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
    server: { baseDir: paths.dist.base },
    notify: false,
    open: true,
    reloadOnRestart: true // NEW: перезагрузка при рестарте
  });
}

// Отслеживание файлов
function watchFiles() { // NEW: вынесено в отдельную функцию
  watch(paths.src.html, html).on('change', browserSync.reload);
  watch(paths.src.scss, styles);
  watch(paths.src.img, images);
}

// Сборка
const build = series(clean, parallel(html, styles, images));

// Задачи
exports.clean = clean;
exports.html = html;
exports.styles = styles;
exports.images = images;
exports.build = build;
exports.watch = watchFiles; // NEW
exports.default = series(build, parallel(serve, watchFiles)); // NEW: улучшенный запуск