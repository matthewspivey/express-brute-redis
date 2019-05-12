class RedisStore {
  constructor({ prefix, client, ttl }) {
    this.prefix = prefix || '';
    this.client = client;
    this.ttl = Math.max(0, ttl);
  }

  // Resets the counters for a key
  // Returns a promise
  reset(key) {
    const prefixedKey = `${this.prefix}${key}`;

    return new Promise((resolve, reject) => {
      this.client.del(prefixedKey, errorMessage => {
        if (errorMessage) {
          reject(errorMessage);
        } else {
          resolve();
        }
      });
    });
  }
}

class FixedWindow extends RedisStore {
  // Increments the counter
  // Returns { count: 1, start: <timestamp> }
  increment(key) {
    const now = Date.now();
    const prefixedKey = `${this.prefix}${key}`;

    const reset = (resolve, reject) => {
      this.client.hmset(prefixedKey, ['start', now, 'count', 1], err => {
        if (err) {
          reject(err);
        } else {
          resolve({
            start: new Date(now),
            count: 1
          });
        }
      });
    };

    return new Promise((resolve, reject) => {
      this.client
        .multi()
        .hsetnx(prefixedKey, 'start', now)
        .hincrby(prefixedKey, 'count', 1)
        .hgetall(prefixedKey)
        .exec((errorMessage, responses) => {
          if (errorMessage) {
            reject(errorMessage);
          } else {
            const [, count, { start }] = responses;
            const startInt = parseInt(start, 10);

            if (now < startInt + this.ttl) {
              resolve({
                start: new Date(startInt),
                count
              });
            } else {
              reset(resolve, reject);
            }
          }
        });
    });
  }
}

module.exports = { FixedWindow };
