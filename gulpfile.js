var gulp = require("gulp"); 
var compass = require("gulp-compass");
var cssmin = require("gulp-cssmin");
var prefix = require("gulp-autoprefixer");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var cssimport = require("gulp-cssimport");
var browserSync = require("browser-sync");
var reload = browserSync.reload;

var path = require("path");
var exec = require('child_process').exec;

var modules = "node_modules/";

var ghostRoot = path.join(__dirname, '../../../');
var cmd = exec("cd " + ghostRoot + " && npm start");
gulp.task("ghost", function() {
  cmd.stdout.on('data', function(data) {
    process.stdout.write(data);
    
    if (data.indexOf("Listening") !=-1) {
      browserSync.init({
        proxy: "localhost:2368"
      });
    }
  });
});

// style
gulp.task("style", function () {
  return gulp.src("assets/style/style.*")
    .pipe(compass({
      css: "assets/css",
      sass: "assets/style",
      image: "assets/img"
    }))
    .pipe(cssimport())
    .pipe(prefix())
    .pipe(cssmin())
    .pipe(gulp.dest("assets/css"))
    .pipe(reload({stream:true}));
    
});

// minify js
gulp.task("minify", function () {
  return gulp.src([
    modules + "jquery-validation/dist/jquery.validate.js",
    "assets/js/scripts.js"
  ])
  .pipe(uglify())
  .pipe(concat("minified.js"))
  .pipe(gulp.dest("assets/js"));
});

// js
gulp.task("js", ["minify"], function () {
  return gulp.src([
    modules + "chartist/dist/chartist.min.js",
    modules + "clappr/dist/clappr.min.js",
    "assets/js/minified.js"
  ])
  .pipe(concat("main.js"))
  .pipe(gulp.dest("assets/js"));
});

gulp.task("js-reload", ["js"], function () {
    reload();
});

gulp.task("reload", function () {
    reload();
});

gulp.task("default", ["ghost"], function () {
  gulp.watch("assets/style/**/*", ["style"]);
  gulp.watch("assets/js/scripts.js", ["js-reload"]);
  gulp.watch("**/*.hbs", ["reload"]);
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