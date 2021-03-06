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
  increment(key, lifetime, refreshTimeout = false) {
    return new Promise((resolve, reject) => {
      const prefixedKey = this.prefix + key;
      const transaction = this.client
        .multi()
        .hsetnx(prefixedKey, 'first', Date.now()) // set timestamp of first call
        .hsetnx(prefixedKey, 'count', 0) // initialize the count if hasn't been
        .hincrby(prefixedKey, 'count', 1);

      if (refreshTimeout) {
        transaction.expire(prefixedKey, lifetime);
      }

      transaction.hgetall(prefixedKey).exec((errorMessage, responses) => {
        if (errorMessage) {
          reject(errorMessage);
        } else {
          const { first, count } = responses[refreshTimeout ? 4 : 3];
          resolve({
            first: new Date(parseInt(first, 10)),
            count: parseInt(count, 10)
          });
        }
      });
    });
  }
}
module.exports = RedisStore;
