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
    svgmin: require('gulp-svgmin'),
    htmlmin: require("gulp-htmlmin"),
    replace: require('gulp-replace'),
    uglify: require('gulp-uglify'),
    babel: require('gulp-babel'),
    csso: require('gulp-csso'),
    imagemin: require('gulp-imagemin')
  },

  paths: {
    src: `source`,
    fonts: 'source/fonts',
    js: 'source/js',
    img: 'source/img',
    sass: 'source/sass',
    css: 'source/css',
    build: 'build',
    buildCss: 'build/css',
  },

  names: {
    ext: {
      png: `.png`,
      jpg: `.jpg`,
      svg: `.svg`,
      webp: `.webp`,
      html: `.html`,
      woff: `.woff`,
      woff2: `.woff2`,
      js: `.js`,
      jsMin: `.min.js`,
      cssMin: `.min.css`,
      scss: `.scss`
    },
    perix: {
      icon: `icon`
    },
    spriteSvg: `sprite`,
    resultStyle: `style.scss`,
    linkHrefEnd: `.css"`,
    scriptSrcEnd: `.js"`,
    linkHrefEndMin: `.min.css"`,
    srciptSrcEndMin: `.min.js"`
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

    server (serverDir, done) {
      TM.pkgs.sync.init({
        server: {
          baseDir: serverDir
        },
        cors: true,
        notify: false,
        ui: false,
      });
      done();
    },

    watcher ()  {
      TM.pkgs.gulp.watch(
        `${TM.paths.sass}/**/*${TM.names.ext.scss}`,
        TM.pkgs.gulp.series(TM.tasks.styles)
      );
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
    },

    build: {
      fonts () {
        const fontsGlob =
          `${TM.paths.fonts}/**/*{${TM.names.ext.woff},${TM.names.ext.woff2}}`;

        return TM.pkgs.gulp.src(fontsGlob, {base: TM.paths.src})
          .pipe(TM.pkgs.gulp.dest(TM.paths.build));
      },

      html() {
        return TM.pkgs.gulp.src(`${TM.paths.src}/*${TM.names.ext.html}`)
          .pipe(TM.pkgs.replace(TM.names.linkHrefEnd, TM.names.linkHrefEndMin))
          .pipe(TM.pkgs.replace(TM.names.scriptSrcEnd, TM.names.srciptSrcEndMin))
          .pipe(TM.pkgs.htmlmin({
            collapseWhitespace: true,
            removeComments: true
          }))
          .pipe(TM.pkgs.gulp.dest(TM.paths.build))
      },

      cleanDir(){
        return TM.pkgs.del(TM.paths.build);
      },

      js() {
        const jsGlob = `${TM.paths.js}/*${TM.names.ext.js}`;

        return TM.pkgs.gulp.src(jsGlob, {base: TM.paths.src})
          .pipe(TM.pkgs.babel({
            presets: ['babel-preset-env']
          }))
          .pipe(TM.pkgs.uglify())
          .pipe(TM.pkgs.rename((path) => {
            path.extname = TM.names.ext.jsMin;
          }))
          .pipe(TM.pkgs.gulp.dest(TM.paths.build))
      },

      styles() {
        const stylesGlob = `${TM.paths.sass}/${TM.names.resultStyle}`;

        return TM.pkgs.gulp.src(stylesGlob)
          .pipe(TM.pkgs.sass())
          .pipe(TM.pkgs.postcss([
            TM.pkgs.autoprefixer()
          ]))
          .pipe(TM.pkgs.csso())
          .pipe(TM.pkgs.rename((path) => {
            path.extname = TM.names.ext.cssMin;
          }))
          .pipe(TM.pkgs.gulp.dest(TM.paths.buildCss))
      },

      imgs(){
        const imgGlob = `${TM.paths.img}/**/*`;

        return TM.pkgs.gulp.src(imgGlob, {base: TM.paths.src})
          .pipe(TM.pkgs.imagemin([
            TM.pkgs.imagemin.mozjpeg({quality: 90, progressive: true}),
            TM.pkgs.imagemin.optipng({optimizationLevel: 3}),
            TM.pkgs.imagemin.svgo({
              plugins: [{cleanupIDs: false}]
            })
          ]))
          .pipe(TM.pkgs.gulp.dest(TM.paths.build));
      }
    }
  }
}

//(( EXPORTS ))
exports.webp = TM.tasks.webp;
exports.spriteSvg = TM.tasks.spriteSvg;

exports.default = TM.pkgs.gulp.series(
  TM.tasks.styles,
  TM.tasks.server.bind(this, TM.paths.src),
  TM.tasks.watcher
);

exports.build = TM.pkgs.gulp.series(
  TM.tasks.build.cleanDir,
  TM.pkgs.gulp.parallel(
    TM.tasks.build.html,
    TM.tasks.build.styles,
    TM.tasks.build.imgs,
    TM.tasks.build.js,
    TM.tasks.build.fonts
  ),
  // TM.tasks.server.bind(this, TM.paths.build)
);
