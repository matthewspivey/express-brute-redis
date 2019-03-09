const chai = require('chai');
const RedisMock = require('redis-mock');
const RedisStore = require('../index.js');

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
      client
    });
    client.flushall();
  });

  it('can be instantiated', () => {
    expect(instance).to.be.an.instanceof(RedisStore);
  });

  it('can initialize key', async () => {
    const { count, last } = await instance.increment(key);

    expect(count).to.equal(1);
    expect(last).to.be.at.most(new Date(Date.now()));
  });

  it('can update key', async () => {
    Array(99)
      .fill('')
      .forEach(async () => {
        await instance.increment(key);
      });

    const { last, count } = await instance.increment(key);

    expect(count).to.equal(100);
    expect(last).to.be.below(new Date(Date.now()));
  });

  it('can reset the counters', async () => {
    await instance.increment(key);
    await instance.reset(key);

    const { count } = await instance.increment(key);
    expect(count).to.equal(1);
  });
});
