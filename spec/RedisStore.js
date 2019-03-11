const chai = require('chai');
const RedisMock = require('redis-mock');
const RedisStore = require('../index.js');

describe('Express brute redis store', () => {
  const { expect } = chai;
  const key = 'key';
  const lifetime = 1000;
  let instance;
  let testCount = 0;
  const client = RedisMock.createClient();
  beforeEach(() => {
    testCount += 1;
    instance = new RedisStore({
      prefix: `test${testCount}`,
      client
    });
    client.flushall();
  });

  it('can be instantiated', () => {
    expect(instance).to.be.an.instanceof(RedisStore);
  });

  it('can initialize key', async () => {
    const { count, first } = await instance.increment(key, lifetime);

    expect(count).to.equal(1);
    expect(first).to.be.at.most(new Date(Date.now()));
  });

  it('can update key', async () => {
    Array(999)
      .fill('')
      .forEach(async () => {
        await instance.increment(key, lifetime);
      });

    const { first, count } = await instance.increment(key, lifetime);
    expect(count).to.equal(1000);
    expect(first).to.be.below(new Date(Date.now()));
  });

  it('can reset the counters', async () => {
    await instance.increment(key, lifetime);
    await instance.reset(key);

    const { count } = await instance.increment(key, lifetime);
    expect(count).to.equal(1);
  });

  // TODO - handle lifetime
});
