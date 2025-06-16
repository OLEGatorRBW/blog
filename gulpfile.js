const { src, dest, parallel, series, watch } = require('gulp');
const fileInclude = require('gulp-file-include');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const webp = require('gulp-webp');
const size = require('gulp-size');
const del = require('del');
const terser = require('gulp-terser'); 
const sourcemaps = require('gulp-sourcemaps'); 

// Пути и остальной код остаются без изменений...

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
  return del([paths.dist.base]);
}

// Оптимизация изображений
function images() {
  return src(paths.src.img)
    .pipe(newer(paths.dist.img))
    .pipe(imagemin([
      imagemin.mozjpeg({ quality: 80 }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({
        plugins: [
          { removeViewBox: false },
          { cleanupIDs: false }
        ]
      })
    ]))
    .pipe(size({ showFiles: true }))
    .pipe(dest(paths.dist.img))
    .pipe(browserSync.stream());
}

// Конвертация в WebP (исправленная версия)
function convertToWebp() {
  return src(paths.src.img)
    .pipe(newer({
      dest: paths.dist.img,
      ext: '.webp'
    }))
    .pipe(webp({ 
      quality: 80,
      method: 6 // Добавляем явное указание метода сжатия
    }))
    .pipe(dest(paths.dist.img))
    .pipe(browserSync.stream());
}

// HTML
function html() {
  return src(paths.src.html)
    .pipe(fileInclude())
    .pipe(dest(paths.dist.html))
    .pipe(browserSync.stream());
}

// SCSS -> CSS
function styles() {
  return src(paths.src.scss)
    .pipe(sass().on('error', sass.logError))
    .pipe(dest(paths.dist.css))
    .pipe(browserSync.stream());
}

// JS
// Обновляем задачу scripts()
function scripts() {
  return src(paths.src.js)
    .pipe(sourcemaps.init()) // Инициализация
    .pipe(terser({
      keep_fnames: true,
      mangle: { reserved: ['$', 'jQuery'] }
    }))
    .on('error', function(err) {
      console.error('Error in scripts task:', err.toString());
      this.emit('end');
    })
    .pipe(sourcemaps.write('.')) // Запись .map файлов
    .pipe(dest(paths.dist.js))
    .pipe(browserSync.stream());
}

// Сервер
function serve() {
  browserSync.init({
    server: { baseDir: paths.dist.base },
    notify: false,
    port: 3000
  });

  watch(paths.src.html, html);
  watch(paths.src.scss, styles);
  watch(paths.src.js, scripts);
  watch(paths.src.img, series(images, convertToWebp));
}

// Сборка
const build = series(
  clean,
  parallel(
    html,
    styles,
    scripts,
    series(images, convertToWebp)
  )
);

// Экспорт
exports.images = images;
exports.webp = convertToWebp;
exports.build = build;
exports.default = series(build, serve);