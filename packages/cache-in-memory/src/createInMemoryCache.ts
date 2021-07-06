import { Cache } from '@algolia/cache-common';

import { InMemoryCacheOptions } from '.';

export function createInMemoryCache({
  serializable = true,
  initialCache = {},
}: InMemoryCacheOptions = {}): Cache {
  // eslint-disable-next-line functional/no-let
  let cache: Record<string, any> = initialCache;

  return {
    get(
      key,
      defaultValue,
      events = {
        miss: () => Promise.resolve(),
      }
    ) {
      const keyAsString = JSON.stringify(key);

      if (keyAsString in cache) {
        return Promise.resolve(serializable ? JSON.parse(cache[keyAsString]) : cache[keyAsString]);
      }

      const promise = defaultValue();
      const miss = (events && events.miss) || (() => Promise.resolve());

      return promise.then(value => miss(value)).then(() => promise);
    },

    set(key, value) {
      // eslint-disable-next-line functional/immutable-data
      cache[JSON.stringify(key)] = serializable ? JSON.stringify(value) : value;

      return Promise.resolve(value);
    },

    delete(key) {
      // eslint-disable-next-line functional/immutable-data
      delete cache[JSON.stringify(key)];

      return Promise.resolve();
    },

    clear() {
      cache = {};

      return Promise.resolve();
    },

    entries() {
      return Promise.resolve(cache);
    },
  };
}
