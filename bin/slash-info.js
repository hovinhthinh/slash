#!/usr/bin/env node
var program = require('commander');

var slash = require('../');
var invoke = require('../lib/util/invoke');
var pkg = require('../package.json');

program
  .option('-u --url <url>', 'Url to get info')
  .version(pkg.version)
  .parse(process.argv);

invoke(slash.info);
