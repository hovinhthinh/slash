var gulp = require('gulp');
var $ = gulp.$;
var pipe = require('./helpers/pipe');

gulp.task('lint', 'Lint source code.', function () {
  return pipe(
    gulp.src([
      '{bin,lib,tasks,test}/**/*.js',
      'gulpfile.js'
    ]),
    $.cached('linting'),
    $.jscs(),
    $.jshint(),
    $.jshint.reporter('jshint-stylish')
  );
});
