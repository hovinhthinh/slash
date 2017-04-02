#!/usr/bin/env node
var program = require('commander');

var slash = require('../');
var invoke = require('../lib/util/invoke');
var pkg = require('../package.json');

program
  .option('-s --site <site>', 'Site to get stats')
  .version(pkg.version)
  .parse(process.argv);

invoke(slash.stats);
