class RedisStore {
  constructor({ prefix, client }) {
    this.prefix = prefix || '';
    this.client = client;
  }

  set(key, value, lifetime, callback) {
    const lifetimeInt = parseInt(lifetime, 10) || 0;
    const multi = this.client.multi();
    const redisKey = this.prefix + key;

    multi.set(redisKey, JSON.stringify(value));
    if (lifetimeInt > 0) {
      multi.expire(redisKey, lifetimeInt);
    }
    multi.exec(() => {
      if (typeof callback === 'function') {
        callback.call(this, null);
      }
    });
  }

  get(key, callback) {
    this.client.get(this.prefix + key, (err, data) => {
      if (typeof callback !== 'function') {
        return;
      }
      if (err || !data) {
        callback(err, null);
      } else {
        const parsed = JSON.parse(data);
        callback(err, {
          ...parsed,
          lastRequest: new Date(parsed.lastRequest),
          firstRequest: new Date(parsed.firstRequest),
        });
      }
    });
  }

  reset(key, callback) {
    this.client.del(this.prefix + key, (...args) => {
      if (typeof callback === 'function') {
        callback.apply(this, args);
      }
    });
  }

  // TODO can we make this a more atomic operation using Redis eval
  increment(key, lifetime, callback) {
    const self = this;
    this.get(key, (err, value) => {
      if (err) {
        callback(err);
        return;
      }
      const count = value ? value.count + 1 : 1;
      self.set(
        key,
        { count, lastRequest: new Date(), firstRequest: new Date() },
        lifetime,
        (err2) => {
          const prevValue = {
            count: value ? value.count : 0,
            lastRequest: value ? value.lastRequest : null,
            firstRequest: value ? value.firstRequest : null,
          };
          if (typeof callback === 'function') {
            callback(err2, prevValue);
          }
        },
      );
    });
  }
}
module.exports = RedisStore;
