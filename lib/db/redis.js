import wrapRedisClient from 'co-redis';
import { createClient as createRedisClient } from 'redis';

import { redis as config } from '../../config/database';

let redis = wrapRedisClient(
  createRedisClient(
    config.port,
    config.host
  )
);

// LPOP from a list and SADD to a set.
// Returns the value or null.
redis.lpopsadd = function *(list, set) {
  return yield redis.eval(`
    if redis.call("LLEN", KEYS[1]) == 0 then
      return nil
    else
      local val = redis.call("LPOP", KEYS[1])
      redis.call("SADD", KEYS[2], val)
      return val
    end
  `, 2, list, set);
};

// SETNX a key with the value of val.
// If the key is not set before, EXPIRE it in time seconds.
// Returns value from SETNX.
redis.setnxex = function *(key, val, time) {
  return yield redis.eval(`
    local val = redis.call("SETNX", KEYS[1], ARGV[1])
    if val == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[2])
    end
    return val
  `, 1, key, val, time);
};

// Checks if a member is in a set.
// If it is not, adds it to that set and appends it to a list.
redis.saddnxrpush = function *(set, member, list) {
  return yield redis.eval(`
    local exist = redis.call("SISMEMBER", KEYS[1], ARGV[1])
    if exist == 0 then
      redis.call("SADD", KEYS[1], ARGV[1])
      redis.call("RPUSH", KEYS[2], ARGV[1])
      return 1;
    else
      return 0;
    end
  `, 2, set, list, member);
};

// Removes a member from setA and adds the member to setB.
redis.sremsadd = function *(setA, setB, member) {
  return yield redis.eval(`
    redis.call("SREM", KEYS[1], ARGV[1]);
    redis.call("SADD", KEYS[2], ARGV[1]);
  `, 2, setA, setB, member);
};

// Removes a member from a set and adds to a list.
redis.sremlpush = function *(set, member, list) {
  return yield redis.eval(`
    local exist = redis.call("SISMEMBER", KEYS[1], ARGV[1])
    if exist == 1 then
      redis.call("SREM", KEYS[1], ARGV[1])
      redis.call("LPUSH", KEYS[2], ARGV[1])
    end
  `, 2, set, list, member);
};

// Removes lowest member from a sorted set and adds to a hash table.
// Return the member with score
redis.zpophset = function *(set, hash) {
  return yield redis.eval(`
    local a = redis.call("ZRANGE", KEYS[1], 0, 0, "WITHSCORES")
    if table.getn(a) == 2 then
      local member = a[1]
      local score = a[2]
      redis.call("ZREM", KEYS[1], member)
      redis.call("HSET", KEYS[2], member, score)
      return member
    else
      return nil
    end
  `, 2, set, hash);
};

// Removes a [key,value] from a hash table and adds to a sorted set with value is the score.
redis.hpopzadd = function *(hash, key, set) {
  return yield redis.eval(`
    local score = redis.call("HGET", KEYS[1], ARGV[1])
    if score ~= false then
      redis.call("HDEL", KEYS[1], ARGV[1])
      redis.call("ZADD", KEYS[2], score, ARGV[1])
      return 1
    else
      return 0
    end
  `, 2, hash, set, key);
};

// Removes a [key,value] from a hash table and adds to a sorted set with score.
redis.hpopzaddsc = function *(hash, key, set, score) {
  return yield redis.eval(`
    redis.call("HDEL", KEYS[1], ARGV[1])
    redis.call("ZADD", KEYS[2], ARGV[2], ARGV[1])
    return nil
  `, 2, hash, set, key, score);
};

// Adds a scored member to a sorted set if the membet is not exist in both set and hash table.
redis.zaddnx = function *(set, hash, member, score) {
  return yield redis.eval(`
    local score = redis.call("HGET", KEYS[2], ARGV[1])
    if score == false then
      score = redis.call("ZSCORE", KEYS[1], ARGV[1])
      if score == false then
          redis.call("ZADD", KEYS[1], ARGV[2], ARGV[1])
          return 1
      end
    end
    return 0
  `, 2, set, hash, member, score);
};

export default redis;
