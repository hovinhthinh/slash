#!/usr/bin/env node
var program = require('commander');
var pkg = require('../package.json');

process.argv[1] = __filename;

program
  .version(pkg.version)
  .command('crawl', 'Crawl URLs from a specific site')
  .command('requeue', 'Restart failed tasks manually')
  .command('push', 'Push a URL into queue to process')
  .command('info', 'Get info of a URL')
  .command('stats', 'Get statistics of a site')
  .command('ls-sites', 'List all supported sites')
  .parse(process.argv);

if (!program.runningCommand) {
  program.outputHelp();
}
