// TM = TaskManager
const TM = {
  pkgs: {
    gulp: require("gulp"),
    plumber: require("gulp-plumber"),
    sourcemap: require("gulp-sourcemaps"),
    sass: require("gulp-sass"),
    postcss: require("gulp-postcss"),
    autoprefixer: require("autoprefixer"),
    sync: require("browser-sync").create(),
    webp: require('gulp-webp'),
    del: require("del"),
    rename: require("gulp-rename"),
    svgstore: require("gulp-svgstore"),
    svgmin: require('gulp-svgmin')
  },

  paths: {
    src: `source`,
    fonts: 'source/fonts',
    js: 'source/js',
    img: 'source/img',
    sass: 'source/sass',
    css: 'source/css',
    build: 'build',
  },

  names: {
    ext: {
      png: `.png`,
      jpg: `.jpg`,
      svg: `.svg`,
      webp: `.webp`
    },
    perix: {
      icon: `icon`
    },
    spriteSvg: `sprite`,
    resultStyle: `style.scss`
  },

  tasks: {
    styles ()  {
      return TM.pkgs.gulp.src(`${TM.paths.sass}/${TM.names.resultStyle}`)
        .pipe(TM.pkgs.plumber())
        .pipe(TM.pkgs.sourcemap.init())
        .pipe(TM.pkgs.sass())
        .pipe(TM.pkgs.postcss([
          TM.pkgs.autoprefixer()
        ]))
        .pipe(TM.pkgs.sourcemap.write("."))
        .pipe(TM.pkgs.gulp.dest(TM.paths.css))
        .pipe(TM.pkgs.sync.stream());
    },

    server (done) {
      TM.pkgs.sync.init({
        server: {
          baseDir: TM.paths.src
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
      const webpGlob = `${TM.paths.img}/**/*${TM.names.ext.webp}`;
      const imgGlob =
        `${TM.paths.img}/**/*{${TM.names.ext.jpg},${TM.names.ext.png}}`;

      const createWebpImages = () => {
        TM.pkgs.gulp.src(imgGlob)
          .pipe(TM.pkgs.webp())
          .pipe(TM.pkgs.gulp.dest(TM.paths.img))
      };

      return TM.pkgs.del(webpGlob).then(createWebpImages);
    },

    spriteSvg () {
      const svgGlob =
        `${TM.paths.img}/**/${TM.names.perix.icon}-*${TM.names.ext.svg}`;
      const newSpriteName = `${TM.names.spriteSvg}${TM.names.ext.svg}`;

      const svgMinPlugins = [
        {
          removeViewBox: false
        },
        {
          removeStyleElement: true
        },
        {
          removeScriptElement: true
        },
        {
          removeAttrs: {
            preserveCurrentColor: true,
            attrs: `(fill|stroke|style)`
          }
        }

      ];

      const createSpriteSvg = () => {
        TM.pkgs.gulp.src(svgGlob)
          .pipe(TM.pkgs.svgmin({
            plugins: svgMinPlugins
          }))
          .pipe(TM.pkgs.svgstore())
          .pipe(TM.pkgs.rename(newSpriteName))
          .pipe(TM.pkgs.gulp.dest(TM.paths.img));
      };

      return TM.pkgs.del(`${TM.paths.img}/${newSpriteName}`).then(
        createSpriteSvg
      )
    }
  }
}

//(( EXPORTS ))
exports.styles = TM.tasks.styles;
exports.webp = TM.tasks.webp;
exports.spriteSvg = TM.tasks.spriteSvg;
exports.default = TM.pkgs.gulp.series(
  TM.tasks.styles,
  TM.tasks.server,
  TM.tasks.watcher
);
