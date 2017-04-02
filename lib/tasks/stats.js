import redis from '../db/redis';
import { redis as redisCfg } from '../../config/database';
import mongo from '../db/mongo';

export default function *stats(argv) {
  let redisNs = redisCfg.namespace + ':' + argv.site;
  let tracksCollection = mongo.get('tracks');
  let artistsCollection = mongo.get('artists');

  let queueSize = yield redis.zcard(redisNs + ':queue');
  let processSize = yield redis.hlen(redisNs + ':process');

  console.log('Queue size:', queueSize);
  console.log('Processing:', processSize);

  tracksCollection
    .count()
    .then(count => {
      console.log('Tracks size:', count);
    });
  artistsCollection
    .count()
    .then(count => {
      console.log('Artists size:', count);
    });
}
