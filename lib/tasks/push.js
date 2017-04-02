import redis from '../db/redis';
import { redis as redisCfg } from '../../config/database';

let redisNs = redisCfg.namespace;

export default function *push(argv) {
  let site = argv.site;
  let url = argv.url;

  if (!site || !url) {
    console.log('Site or Url is missing.');
    return;
  }

  let queue = redisNs + ':' + site + ':queue';
  let process = redisNs + ':' + site + ':process';

  yield redis.zaddnx(queue, process, url, Date.now());

  console.log('Pushed', url, 'to', queue, 'successfully.');
}
