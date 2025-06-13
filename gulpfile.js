const { src, dest, parallel, series, watch } = require('gulp');
const fileInclude = require('gulp-file-include');
const sass = require('gulp-sass')(require('sass'));
const browserSync = require('browser-sync').create();
const { deleteSync } = require('del');
const fs = require('fs');


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
  const fs = require('fs');
  if (fs.existsSync(paths.dist.base)) {
    fs.rmSync(paths.dist.base, { recursive: true });
  }
  return Promise.resolve();
}

// HTML
function html() {
  return src('src/html/**/*.html')
    .pipe(fileInclude({
      prefix: '@@',
      basepath: '@file',
      context: {  // Передача переменных
        env: process.env.NODE_ENV
      }
    }))
    .pipe(dest('dist/'));
}

// SCSS
function styles() {
  // Принудительно создаём папку
  if (!fs.existsSync('dist/css')) {
    fs.mkdirSync('dist/css', { recursive: true });
  }

  return src('src/scss/main.scss') // Явно указываем входной файл
    .pipe(sass().on('error', (err) => {
      console.error('SASS Error:', err.message);
    }))
    .pipe(dest('dist/css'))
    .on('end', () => {
      console.log('SCSS compiled successfully!');
      console.log('Check dist/css/main.css');
    });
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
    open: true
  });

  watch(paths.src.html, html);
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
exports.default = series(build, serve);