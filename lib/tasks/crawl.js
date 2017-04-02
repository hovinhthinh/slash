import Promise from 'bluebird';
import co from 'co';
import sleep from 'co-sleep';
import ReadableStream from 'readable-stream';
import through from 'through2';

import { redis as redisCfg } from '../../config/database';
import mongo from '../db/mongo';
import redis from '../db/redis';
import Page from '../models/page';
import Site from '../models/site';
import eos from '../util/end-of-stream';
import request from '../util/request';
import { normalize as normalizeUrl } from '../util/url';

let mongoCollection = {};
function getMongoCollection(collection) {
  if (!mongoCollection[collection]) {
    mongoCollection[collection] = mongo.get(collection);
    mongoCollection[collection].index('url', { unique: true });
  }
  return mongoCollection[collection];
}

export default function *crawl(argv) {
  let args = {
    site: argv.site,
    redisNs: redisCfg.namespace + ':' + argv.site
  };

  let fetched = dequeue(args)
    .pipe(filter(args))
    .pipe(fetch(args));

  let saved = fetched
    .pipe(fetchOptionals(args))
    .pipe(extractModel(args))
    .pipe(save(args))
    .pipe(reenqueue(args));

  let enqueued = fetched
    .pipe(extractUrls(args))
    .pipe(enqueue(args));

  return Promise.all([
    eos(enqueued),
    eos(saved)
  ]);
}

class DequeueStream extends ReadableStream {
  constructor(args) {
    ReadableStream.call(this, {
      highWaterMark: 0,
      objectMode: true
    });

    this.site = args.site;
    this.redisNs = args.redisNs;
  }

  _read() {
    let self = this;
    let redisNs = this.redisNs;

    co(function *() {
      try {
        let url;

        for (let numTry = 0; numTry < 10; numTry++) {
          url = yield redis.zpophset(redisNs + ':queue',
                                     redisNs + ':process');
          if (!url) {
            console.log('Dequeue: Retry #' + numTry);
            yield sleep(1000);
          } else {
            break;
          }
        }

        if (url) {
          // console.log('Dequeue:', url);
          self.push(new Page(url));
        } else {
          self.emit('end');
        }
      } catch (err) {
        self.emit('error', err);
      }
    });
  }
}

function dequeue(args) {
  return new DequeueStream(args);
}

// Returns if a task was completed or being processed.
function filter(args) {
  let redisNs = args.redisNs;
  let site = new (Site.get(args.site))();

  return through.obj((page, enc, cb) => {
    co(function *() {

      if (site.isBlacklisted(page.url)) {
        yield redis.hdel(redisNs + ':process', page.url);
        console.log('Filter:', page.url);
        return cb();
      }

      cb(null, page);
    });
  });
}

function fetch(args) {
  let redisNs = args.redisNs;
  let site = new (Site.get(args.site))();

  return through.obj((page, enc, cb) => {
    co(function *() {
      console.log('Fetch:', page.url);
      try {
        if (!page.content) {
          page.content = yield request(page.url);
        }
        page.config = site.getStoreConfig(page.url);
        cb(null, page);
      } catch (err) {
        // Recrawl with high priority (default is 1 day)
        console.log(err + ' at ' + page.url);
        yield redis.hpopzaddsc(redisNs + ':process', page.url,
                                redisNs + ':queue',
                                Date.now() +
                                  site.getFailRecrawlingDelay(page.url));
        cb();
      }
    });
  });
}

function save(args) {
  return through.obj((page, enc, cb) => {
    if (!page.config) {
      return cb(null, page);
    }

    let opts = [];
    for (let u of page.optionals) {
      opts.push(u.url);
    }
    getMongoCollection(page.config.collection)
      .update({
          url: page.url
        }, {
          url: page.url,
          time: Date.now(),
          optionals: opts,
          info: (page.info ? page.info : null)
        }, {
          upsert: true
        }, function () {
          cb(null, page);
        });
  });
}

function extractUrls(args) {
  let site = new (Site.get(args.site))();

  return through.obj((page, enc, cb) => {
    page.extractedUrls = site.extractUrls(page).map(url => normalizeUrl(url));
    cb(null, page);
  });
}

function fetchOptionals(args) {
  let site = new (Site.get(args.site))();
  let redisNs = args.redisNs;

  return through.obj((page, enc, cb) => {
    co(function *() {
      if (!page.config) {
        return cb(null, page);
      }

      page.optionals = [];
      let optionals = site.getAssociatedUrls(page);
      let opt;
      try {
        for (opt of optionals) {
          let oc = yield request(opt);
          page.optionals.push({
            url: opt,
            content: oc ? oc : null
          });
        }
        cb(null, page);
      } catch (err) {
        // Recrawl with high priority (default is 1 day)
        console.log(err.stack + ' at optional ' + opt);
        yield redis.hpopzaddsc(redisNs + ':process', page.url,
                                redisNs + ':queue',
                                Date.now() +
                                  site.getFailRecrawlingDelay(page.url));
        cb();
      }
    });
  });
}

function extractModel(args) {
  let site = new (Site.get(args.site))();

  return through.obj((page, enc, cb) => {
    if (!page.config) {
      return cb(null, page);
    }

    if (page.content) {
      let flag = true;
      for (let opt of page.optionals) {
        if (opt['content'] === null) {
          flag = false;
          break;
        }
      }
      if (flag) {
        page.info = site.extractModel(page);
      }
    }
    cb(null, page);
  });
}

function enqueue(args) {
  let redisNs = args.redisNs;

  return through.obj((page, enc, cb) => {
    co(function *() {
      for (let url of page.extractedUrls) {
        yield redis.zaddnx(redisNs + ':queue', redisNs + ':process',
                            url, Date.now());
      }
      cb();
    });
  });
}

function reenqueue(args) {
  let redisNs = args.redisNs;
  let site = new (Site.get(args.site))();

  return through.obj((page, enc, cb) => {
    co(function *() {
      yield redis.hpopzaddsc(redisNs + ':process', page.url,
                                redisNs + ':queue',
                                Date.now() +
                                  site.getRecrawlingDelay(page.url));
      cb();
    });
  });
}
