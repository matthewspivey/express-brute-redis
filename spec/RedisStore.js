const RedisMock = require('redis-mock');
const RedisStore = require('../index.js');

describe('Express brute redis store', () => {
  let instance;
  let callback;
  let count = 0;
  beforeEach(() => {
    count += 1;
    instance = new RedisStore({
      prefix: `test${count}`,
      client: RedisMock.createClient(),
    });
    callback = jasmine.createSpy();
  });

  it('can be instantiated', () => {
    expect(instance).toBeDefined();
    expect(instance instanceof RedisStore).toBeTruthy();
  });

  it('can set a key and get it back', () => {
    const curDate = new Date();
    const object = { count: 1, lastRequest: curDate, firstRequest: curDate };
    runs(() => {
      instance.set('1.2.3.4', object, 0, callback);
    });

    waitsFor(() => callback.calls.length === 1);

    runs(() => {
      expect(callback).toHaveBeenCalledWith(null);

      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 2);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(object);
    });
  });

  it('increments values and returns that last value', () => {
    const curDate = new Date();
    const object = { count: 1, lastRequest: curDate, firstRequest: curDate };
    runs(() => {
      instance.set('1.2.3.4', object, 0, callback);
    });

    waitsFor(() => callback.calls.length === 1);

    runs(() => {
      expect(callback).toHaveBeenCalledWith(null);

      instance.increment('1.2.3.4', 0, callback);
    });

    waitsFor(() => callback.calls.length === 2);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(object);

      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 3);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1].count).toEqual(2);
    });
  });
  it('can increment even if no value was set', () => {
    runs(() => {
      instance.increment('1.2.3.4', 0, callback);
    });

    waitsFor(() => callback.calls.length === 1);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual({
        count: 0,
        lastRequest: null,
        firstRequest: null,
      });

      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 2);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1].count).toEqual(1);
      expect(
        callback.mostRecentCall.args[1].lastRequest instanceof Date,
      ).toBeTruthy();
      expect(
        callback.mostRecentCall.args[1].firstRequest instanceof Date,
      ).toBeTruthy();
    });
  });
  it('returns null when no value is available', () => {
    runs(() => {
      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 1);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(null);
    });
  });
  it('can reset the count of requests', () => {
    const curDate = new Date();
    const object = { count: 1, lastRequest: curDate, firstRequest: curDate };
    runs(() => {
      instance.set('1.2.3.4', object, 0, callback);
    });

    waitsFor(() => callback.calls.length === 1);

    runs(() => {
      expect(callback).toHaveBeenCalledWith(null);

      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 2);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(object);

      instance.reset('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 3);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);

      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 4);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(null);
    });
  });
  it('supports data expiring', () => {
    const curDate = new Date();
    const object = { count: 1, lastRequest: curDate, firstRequest: curDate };

    runs(() => {
      instance.set('1.2.3.4', object, 1, callback);
    });

    waitsFor(() => callback.calls.length === 1);

    runs(() => {
      expect(callback).toHaveBeenCalledWith(null);
    });

    waits(500);

    runs(() => {
      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 2);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(object);
    });

    waits(500);

    runs(() => {
      instance.get('1.2.3.4', callback);
    });

    waitsFor(() => callback.calls.length === 3);

    runs(() => {
      expect(callback.mostRecentCall.args[0]).toBe(null);
      expect(callback.mostRecentCall.args[1]).toEqual(null);
    });
  });
});
