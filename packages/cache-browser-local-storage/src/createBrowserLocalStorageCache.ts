import { Cache, CacheEvents } from '@algolia/cache-common';

import { BrowserLocalStorageOptions } from '.';

export function createBrowserLocalStorageCache(options: BrowserLocalStorageOptions): Cache {
  const namespaceKey = `algoliasearch-client-js-${options.key}`;

  // eslint-disable-next-line functional/no-let
  let storage: Storage;
  const getStorage = () => {
    if (storage === undefined) {
      storage = options.localStorage || window.localStorage;
    }

    return storage;
  };

  const getNamespace = <TValue>(): Record<string, TValue> => {
    return JSON.parse(getStorage().getItem(namespaceKey) || '{}');
  };

  return {
    get<TValue>(
      key: object | string,
      defaultValue: () => Readonly<Promise<TValue>>,
      events: CacheEvents<TValue> = {
        miss: () => Promise.resolve(),
      }
    ) {
      return Promise.resolve()
        .then(() => {
          const keyAsString = JSON.stringify(key);
          // since TValue is needed for getNamespace to have the correct type
          // we need to retype the whole get function.
          // This could be fixed by making cache generic instead of its functions.
          const value = getNamespace<TValue>()[keyAsString];

          return Promise.all([value || defaultValue(), value !== undefined]);
        })
        .then(([value, exists]) => {
          return Promise.all([value, exists || events.miss(value)]);
        })
        .then(([value]) => value);
    },

    set(key, value) {
      return Promise.resolve().then(() => {
        const namespace = getNamespace();

        // eslint-disable-next-line functional/immutable-data
        namespace[JSON.stringify(key)] = value;

        getStorage().setItem(namespaceKey, JSON.stringify(namespace));

        return value;
      });
    },

    delete(key) {
      return Promise.resolve().then(() => {
        const namespace = getNamespace();

        // eslint-disable-next-line functional/immutable-data
        delete namespace[JSON.stringify(key)];

        getStorage().setItem(namespaceKey, JSON.stringify(namespace));
      });
    },

    clear() {
      return Promise.resolve().then(() => {
        getStorage().removeItem(namespaceKey);
      });
    },

    entries() {
      return Promise.resolve().then(() => getNamespace());
    },
  };
}
