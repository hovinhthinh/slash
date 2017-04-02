var Promise = require('bluebird'); // jshint ignore: line
var gulp = require('gulp');
var $ = gulp.$;

// Monkey-patches to fix https://github.com/babel/babel/issues/908
require('isparta/node_modules/babel-core').__esModule = false;

var isparta = require('isparta');

var pipe = require('./helpers/pipe');

gulp.task('test', 'Test the application.', function (cb) {
  var tests = [ '{bin,lib}/**/__test__/**/*.spec.js' ];

  if (!gulp.isWatching) {
    tests.push('test/**/*.spec.js');
  }

  require('babel/register');
  require('../test/setup');

  pipe(
    gulp.src([
      '{bin,lib}/**/*.js',
      '!{bin,lib}/**/__test__/**/*'
    ]),
    $.stripShebang(),
    $.istanbul({
      instrumenter: isparta.Instrumenter,
      includeUntested: true
    }),
    $.istanbul.hookRequire(),
    function () {
      pipe(
        gulp.src(tests, { read: false }),
        $.mocha({ reporter: 'dot' }),
        $.istanbul.writeReports(),
        cb
      );
    }
  );
});
