var gulp = require('gulp');
var runSequence = require('run-sequence');

gulp.task('watch', 'Watch for file changes and do tasks.', function (cb) {
  gulp.isWatching = true;

  runSequence([ 'lint', 'test' ], function (err) {
    gulp.watch([ '{bin,lib,tasks,test}/**/*.js', 'gulpfile.js' ], [ 'lint' ]);
    gulp.watch([ '{bin,lib,test}/**/*' ], [ 'test' ]);
    cb(err);
  });
});
