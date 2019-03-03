express-brute-redis
===================
A Redis store for [express-brute](https://github.com/AdamPflug/express-brute)

Usage
-----
``` js
const ExpressBrute = require('express-brute'),
const RedisStore = require('express-brute-redis');
const redis = require('redis');

const bruteforce = new ExpressBrute(new RedisStore({
  prefix: 'example-',
  client: redis.createClient(6379, '127.0.0.1'),
});

app.post('/auth',
	bruteforce.prevent, // error 403 if we hit this route too often
	function (req, res, next) {
		res.send('Success!');
	}
);
```

Options
-------
- `prefix`       An optional prefix for each redis key, in case you are sharing
                 your redis servers with something generating its own keys.
- `client`       Redis client to use.

For details see [node_redis](https://github.com/NodeRedis/node_redis).
