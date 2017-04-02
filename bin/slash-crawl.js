#!/usr/bin/env node
var program = require('commander');

var slash = require('../');
var invoke = require('../lib/util/invoke');
var pkg = require('../package.json');
var co = require('co');
var cluster = require('cluster');

program
  .version(pkg.version)
  .option('-s, --site <site>', 'Site to crawl')
  .option('-w, --num_worker <num_worker>', 'Number of worker to run')
  .option('-p, --num_process <num_process>', 'Number of process to run')
  .parse(process.argv);

if (cluster.isMaster) {
  co(function *() {
    yield slash.requeue(program);
    invoke(slash.crawl);
  });
} else {
  invoke(slash.crawl);
}
