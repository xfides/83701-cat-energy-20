// TM = TaskManager


class TM {
  static pkgs = {
    gulp: require("gulp"),
    plumber: require("gulp-plumber"),
    sourcemap: require("gulp-sourcemaps"),
    sass: require("gulp-sass"),
    postcss: require("gulp-postcss"),
    autoprefixer: require("autoprefixer"),
    sync: require("browser-sync").create(),
    webp: require('gulp-webp'),
    del: require("del")
  };

  static paths = {
    fonts: 'source/fonts',
    js: 'source/js',
    img: 'source/img',
    sass: 'source/sass',
    css: 'source/css',
    build: 'build',

  };

  static names = {
    extPng: `.png`,
    extJpg: `.jpg`,
    extSvg: `.svg`,
    extWebp: `.webp`
  };

  static tasks = {
    styles ()  {
      return TM.pkgs.gulp.src("source/sass/style.scss")
        .pipe(TM.pkgs.plumber())
        .pipe(TM.pkgs.sourcemap.init())
        .pipe(TM.pkgs.sass())
        .pipe(TM.pkgs.postcss([
          TM.pkgs.autoprefixer()
        ]))
        .pipe(TM.pkgs.sourcemap.write("."))
        .pipe(TM.pkgs.gulp.dest("source/css"))
        .pipe(TM.pkgs.sync.stream());
    },

    server (done) {
      TM.pkgs.sync.init({
        server: {
          baseDir: 'source'
        },
        cors: true,
        notify: false,
        ui: false,
      });
      done();
    },

    watcher ()  {
      TM.pkgs.gulp.watch("source/sass/**/*.scss", TM.pkgs.gulp.series("styles"));
      TM.pkgs.gulp.watch("source/*.html").on("change", TM.pkgs.sync.reload);
    },

    webp ()  {
      const webpGlob = `${TM.paths.img}/**/*${TM.names.extWebp}`;
      const imgGlob =
        `${TM.paths.img}/**/*{${TM.names.extJpg},${TM.names.extPng}}`;

      return TM.pkgs.del(webpGlob)
        .then(
        () => {
          TM.pkgs.gulp.src(imgGlob)
            .pipe(TM.pkgs.webp())
            .pipe(TM.pkgs.gulp.dest(TM.paths.img))
        }
      );

    }
  }
}

exports.styles = TM.tasks.styles;
exports.webp = TM.tasks.webp;
exports.default = TM.pkgs.gulp.series(
  TM.tasks.styles,
  TM.tasks.server,
  TM.tasks.watcher
);
