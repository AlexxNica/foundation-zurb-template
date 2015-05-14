var $      = require('gulp-load-plugins')();
var argv   = require('yargs').argv;
var gulp   = require('gulp');
var rimraf = require('rimraf');
var shipyard = require('shipyard');
var sequence = require('run-sequence');

// Check for --production flag
console.log(argv);
var isProduction = !!(argv.production);

// File paths to various assets are defined here.
var paths = {
  assets: [
    'src/assets/**/*',
    '!src/assets/{!img,js,scss}/**/*'
  ],
  sass: [
    'bower_components/foundation/scss'
  ],
  javascript: [
    'bower_components/jquery-placeholder/jquery.placeholder.js',
    'bower_components/fastclick/lib/fastclick.js',
    'bower_components/jquery/dist/jquery.js',
    'bower_components/jquery.cookie/jquery.cookie.js',
    'bower_components/modernizr/modernizr.js',
    'bower_components/foundation/js/foundation.js',
    'src/assets/js/**/.js',
    'src/assets/js/app.js'
  ]
}

// Import layouts, partials, and data into gulp
// gulp.layouts('./src/layouts/**/*.html');
// gulp.partials('./src/partials/**/*.html');
// gulp.data('./src/data/**/*.{json,yml}');

// Delete the "dist" folder
// This happens every time a build starts
gulp.task('clean', function(done) {
  rimraf('./dist', done);
});

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
gulp.task('copy', function(done) {
  gulp.src(paths.assets)
    .pipe(gulp.dist('./dist/assets'));
});

// Copy page templates into finished HTML files
gulp.task('pages', function() {
  gulp.src('./src/pages/**/*.html')
    .pipe(shipyard({
      layouts: './src/layouts/',
      partials: './src/partials/**/*.html',
      data: './src/data/**/*.{json,yml}'
    }))
    .pipe(gulp.dest('./dist'));
});

// Compile Sass into CSS
// In production, the CSS is compressed
gulp.task('sass', function() {
  var uncss = $.if(isProduction, $.uncss({
    html: ['src/**/*.html']
  }));

  return gulp.src('./src/assets/scss/app.scss')
    .pipe($.sass({
      includePaths: paths.sass,
      outputStyle: (isProduction ? 'compressed' : 'nested'),
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(uncss)
    .pipe(gulp.dest('./dist/assets/css'));
});

// Combine JavaScript into one file
// In production, the file is minified
gulp.task('javascript', function() {
  var uglify = $.if(isProduction, $.uglify()
    .on('error', function (e) {
      console.log(e);
    }));

  return gulp.src(paths.javascript)
    .pipe($.concat('app.js'))
    .pipe(uglify)
    .pipe(gulp.dest('./dist/assets/js'));
});

// Copy images to the "dist" folder
// In production, the images are compressed
gulp.task('images', function() {
  var imagemin = $.if(isProduction, $.imagemin({
    progressive: true
  }));

  return gulp.src('./src/assets/img/**/*')
    .pipe(imagemin)
    .pipe(gulp.dest('./dist/assets/img'));
});

// Build the "dist" folder by running all of the above tasks
gulp.task('build', function(done) {
  sequence('clean', ['pages', 'sass', 'javascript', 'images'], done);
});

// Start a server with LiveReload to preview the site in
gulp.task('server', ['build'], function() {
  return gulp.src('./dist')
    .pipe($.webserver({
      host: 'localhost',
      port: 8000,
      livereload: true,
      open: true
    }));
});

// Build the site, run the server, and watch for file changes
gulp.task('default', ['build', 'server'], function() {
  gulp.watch(paths.assets, ['copy']);
  gulp.watch(['./src/pages/**/*.hbs'], ['pages']);
  gulp.watch(['./assets/scss/**/*.scss'], ['sass']);
  gulp.watch(['./assets/js/**/*.scss'], ['javascript']);
  gulp.watch(['./src/assets/img/**/*'], ['images']);
});
