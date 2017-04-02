import redis from '../db/redis';
import { redis as redisCfg } from '../../config/database';

export default function *requeue(argv) {
  let redisNs = redisCfg.namespace + ':' + argv.site;
  console.log('Requeueing fail tasks...');
  var urls = yield redis.hgetall(redisNs + ':process');

  if (urls) {
    for (var url of Object.keys(urls)) {
      console.log('Requeue:', url);
      yield redis.hpopzadd(redisNs + ':process', url, redisNs + ':queue');
    }
  }
  console.log('Requeueing done.');
}
