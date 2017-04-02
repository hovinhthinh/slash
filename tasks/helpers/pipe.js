var Promise = require('bluebird'); // jshint ignore: line
var multipipe = require('multipipe');

var compact = require('./compact');
var onError = require('./on-error');

exports = module.exports = function () {
  var args = [].slice.call(arguments);

  return multipipe.apply(null, compact(args))
    .on('error', onError);
};
