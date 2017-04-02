var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var requireDir = require('require-dir');

var $ = gulp.$ = gulpLoadPlugins();

gulp.isProduction = (process.env.NODE_ENV === 'production');
gulp.isWatching = false;

$.help(gulp);
requireDir('tasks');

gulp.task('default', 'Point to "help" task.', [ 'help' ]);
