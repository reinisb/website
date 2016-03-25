var gulp = require("gulp");
var del = require("del");
var sass = require("gulp-sass");
var prefix = require("gulp-autoprefixer");
var concat = require("gulp-concat");
var include = require("gulp-include");
var uglify = require("gulp-uglify");
var browserSync = require("browser-sync");
var reload = browserSync.reload;

var path = require("path");
var exec = require("child_process").exec;

var modules = "node_modules/";

var theme = "content/themes/osmc/";
var style = "src/assets/style/";
var js = "src/assets/js/";
var jsDist = theme + "assets/js/";
var css = theme + "assets/css/";
var img = theme + "assets/img/";

var browserStart = false;
// Start server
var cmd = exec("npm run dev");
gulp.task("ghost", function () {
  cmd.stdout.on('data', function (data) {
    process.stdout.write(data);
    if (data.indexOf("Listening on") != -1) {
      if (!browserStart) {
        browserStart = true;
        browserSync.init({
          proxy: "localhost:2369",
          host: "osmc.dev",
          open: "ui"
        });
      }
    }
  });
});

var onError = function (err) {
  console.log(err);
  this.emit("end");
};

// style

var sassOpts = {
  outputStyle: "compressed",
  includePaths: [
    "./node_modules/"
  ]
};

gulp.task("style-main", function () {
  var files = style + "style.scss";
  return gulp.src(files)
    .pipe(sass(sassOpts))
    .on("error", onError)
    .pipe(prefix())
    .pipe(gulp.dest(css))
    .pipe(reload({
      stream: true
    }));
});

// style comments
gulp.task("style-ext", ["style-main"], function () {
  return gulp.src([style + "comments.scss", style + "store.scss"])
    .pipe(sass(sassOpts))
    .on("error", onError)
    .pipe(prefix())
    .pipe(gulp.dest(css));
});

gulp.task("style", ["style-ext"]);

// Discourse
gulp.task("discourse", function() {
  return gulp.src([
    modules + "jquery.dfp/jquery.dfp.min.js",
    js + "discourse.js"
    ])
  .pipe(uglify())
  .pipe(concat("discourse.min.js"))
  .pipe(gulp.dest(js));
});

// minify js
gulp.task("minify", function () {
  return gulp.src([
    modules + "jquery-validation/dist/jquery.validate.js",
    js + "main.js"
  ])
    .pipe(include())
    .pipe(uglify())
    .on("error", onError)
    .pipe(concat("minified.js"))
    .pipe(gulp.dest(js));
});

// js
gulp.task("js", ["minify"], function () {
  return gulp.src([
    modules + "chartist/dist/chartist.min.js",
    modules + "clappr/dist/clappr.min.js",
    js + "minified.js"
  ])
    .pipe(concat("main.js"))
    .pipe(gulp.dest(jsDist))
});

gulp.task("clean:js", ["js"], function () {
  return del(js + "minified.js");
});

gulp.task("js-reload", ["clean:js"], function () {
  reload();
});

gulp.task("reload", function () {
  reload();
});

gulp.task("default", ["ghost", "style", "discourse", "clean:js"], function () {
  gulp.watch([style + "**/*"], ["style"]);
  gulp.watch(js + "**/*.js", ["js-reload"]);
  gulp.watch(theme + "**/*.hbs", ["reload"]);
	gulp.watch(js + "discourse.js", ["discourse"]);
});

process.on('SIGINT', function () {
  killNode();
});
process.on('uncaughtException', function () {
  killNode();
});

function killNode() {
  exec('killall node', function (err, stdout, stderr) {
    process.stdout.write(stdout);
    process.exit();
  });
};