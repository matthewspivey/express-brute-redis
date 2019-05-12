const chai = require('chai');
const RedisMock = require('redis-mock');
const { FixedWindow: RedisStore } = require('../index.js');

describe('Express brute redis store', () => {
  const { expect } = chai;
  const key = 'key';
  let instance;
  let testCount = 0;
  const client = RedisMock.createClient();
  beforeEach(() => {
    testCount += 1;
    instance = new RedisStore({
      prefix: `test${testCount}`,
      client,
      ttl: 1000
    });
    client.flushall();
  });

  it('can be instantiated', () => {
    expect(instance).to.be.an.instanceof(RedisStore);
  });

  it('can initialize key', async () => {
    const { count, start } = await instance.increment(key);

    expect(count).to.equal(1);
    expect(start).to.be.at.most(new Date(Date.now()));
  });

  it('can update key', async () => {
    const iterations = 1000;
    Array(iterations - 1)
      .fill('')
      .forEach(async () => {
        await instance.increment(key);
      });

    const { start, count } = await instance.increment(key);
    expect(count).to.equal(iterations);
    expect(start).to.be.below(new Date(Date.now()));
  });

  it('can reset the counters', async () => {
    await instance.increment(key);
    await instance.reset(key);

    const { count } = await instance.increment(key);
    expect(count).to.equal(1);
  });

  // TODO - handle lifetime
});
