import rewire from 'rewire';
import sleep from 'co-sleep';

describe('Redis', () => {
  beforeEach(function () {
    this.redis = rewire('../redis');
  });

  it('#lpopsadd()', function *() {
    let list = 'slash:list:test';
    let set = 'slash:set:test';

    yield this.redis.del(list);
    yield this.redis.del(set);

    yield this.redis.lpush(list, 'val');

    expect(yield this.redis.lpopsadd(list, set)).to.equal('val');
    expect(yield this.redis.sismember('slash:set:test', 'val')).to.equal(1);

    yield this.redis.del(list);
    yield this.redis.del(set);
  });

  it('#lpopsadd() in case of empty list', function *() {
    let list = 'slash:list:test';
    let set = 'slash:set:test';

    yield this.redis.del(list);
    yield this.redis.del(set);

    expect(yield this.redis.lpopsadd(list, set)).to.equal(null);
    expect(yield this.redis.sismember(set, 'val')).to.equal(0);

    yield this.redis.del(list);
    yield this.redis.del(set);
  });

  it('#setnxex()', function *() {
    let key = 'slash:key:test';
    let timeout = 2;
    let val = 'val';
    this.timeout((val + 1) * 1000);

    yield this.redis.del(key);

    expect(yield this.redis.setnxex(key, val, timeout)).to.equal(1);
    expect(yield this.redis.exists(key)).to.equal(1);

    yield sleep(timeout * 1000);
    expect(yield this.redis.exists(key)).to.equal(0);

    yield this.redis.del(key);
  });

  it('#setnxex() in case of preset key', function *() {
    let key = 'slash:key:test';
    let timeout = 2;
    let val = 'val';

    yield this.redis.set(key, val);

    this.timeout((val + 1) * 1000);

    expect(yield this.redis.setnxex(key, val, timeout)).to.equal(0);

    yield this.redis.del(key);
  });

  it('#zpophset()', function *() {
    let set = 'slash:sset:test';
    let hash = 'slash:hash:test';

    yield this.redis.zadd(set, 3, 'three');
    yield this.redis.zadd(set, 1, 'one');
    yield this.redis.zadd(set, 2, 'two');

    expect(yield this.redis.zpophset(set, hash))
      .to.equal('one');

    yield this.redis.del(set);
    yield this.redis.del(hash);
  });

  it('#hpopzadd()', function *() {
    let set = 'slash:sset:test';
    let hash = 'slash:hash:test';

    yield this.redis.hset(hash, 'three', 3);
    yield this.redis.hset(hash, 'one', 1);
    yield this.redis.hset(hash, 'two', 2);

    expect(yield this.redis.hpopzadd(hash, 'two', set)).to.equal(1);
    expect(yield this.redis.hpopzadd(hash, 'two', set)).to.equal(0);

    yield this.redis.del(set);
    yield this.redis.del(hash);
  });

  it('#zaddnx()', function *() {
    let set = 'slash:sset:test';
    let hash = 'slash:hash:test';

    yield this.redis.zadd(set, 3, 'three');
    yield this.redis.zadd(set, 1, 'one');
    yield this.redis.zadd(set, 2, 'two');
    yield this.redis.hset(hash, 'five', 5);

    expect(yield this.redis.zaddnx(set, hash, 'two', 4)).to.equal(0);
    expect(yield this.redis.zaddnx(set, hash, 'five', 4)).to.equal(0);
    expect(yield this.redis.zaddnx(set, hash, 'four', 4)).to.equal(1);

    yield this.redis.del(set);
    yield this.redis.del(hash);
  });
});
