function toRedisValue(count = 0, lastRequest = null, firstRequest = null) {
  return JSON.stringify({
    count,
    lastRequest,
    firstRequest
  });
}

class RedisStore {
  constructor({ prefix, client }) {
    this.prefix = prefix || '';
    this.client = client;
  }

  redisKey(key) {
    return this.prefix + key;
  }

  set(key, value, lifetime, callback) {
    const lifetimeInt = parseInt(lifetime, 10) || 0;
    const doCallback = () => {
      if (typeof callback === 'function') {
        callback.call(this, null);
      }
    };
    const redisValue = toRedisValue(value.count, value.lastRequest, value.firstRequest);

    if (lifetimeInt > 0) {
      this.client.set(this.redisKey(key), redisValue, 'EX', lifetimeInt, doCallback);
    } else {
      this.client.set(this.redisKey(key), redisValue, doCallback);
    }
  }

  get(key, callback) {
    if (typeof callback !== 'function') {
      return;
    }

    this.client.get(this.redisKey(key), (err, data) => {
      if (err || !data) {
        callback(err, null);
        return;
      }

      const { count, lastRequest, firstRequest } = JSON.parse(data);
      callback(err, {
        count,
        lastRequest: new Date(lastRequest),
        firstRequest: new Date(firstRequest)
      });
    });
  }

  reset(key, callback) {
    this.client.del(this.redisKey(key), (...args) => {
      if (typeof callback === 'function') {
        callback.apply(this, args);
      }
    });
  }

  // TODO can we make this a more atomic operation using Redis eval
  increment(key, lifetime, callback) {
  }
}
module.exports = RedisStore;
