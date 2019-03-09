class RedisStore {
  constructor({ prefix, client }) {
    this.prefix = prefix || '';
    this.client = client;
  }

  // Resets the counters for a key
  // Returns a promise
  reset(key) {
    return new Promise((resolve, reject) => {
      this.client.del(this.prefix + key, errorMessage => {
        if (errorMessage) {
          reject(errorMessage);
        } else {
          resolve();
        }
      });
    });
  }

  // Increments the counter
  // Returns { count: 1, last: <timestamp> }
  increment(key, lifetime) {
    return new Promise((resolve, reject) => {
      const prefixedKey = this.prefix + key;
      const transaction = this.client
        .multi()
        .hset(prefixedKey, 'last', Date.now())
        .hsetnx(prefixedKey, 'count', 0) // initialize the count if hasn't been
        .hincrby(prefixedKey, 'count', 1);

      const hasLifetime = lifetime > 0;
      if (hasLifetime) {
        transaction.expire(prefixedKey, lifetime);
      }

      transaction.hgetall(prefixedKey).exec((errorMessage, responses) => {
        if (errorMessage) {
          reject(errorMessage);
        } else {
          const { last, count } = responses[hasLifetime ? 4 : 3];
          resolve({
            last: new Date(parseInt(last, 10)),
            count: parseInt(count, 10)
          });
        }
      });
    });
  }
}
module.exports = RedisStore;
