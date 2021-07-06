import { CacheEvents } from '.';

export type Cache = {
  /**
   * Gets the value of the given `key`.
   */
  readonly get: <TValue>(
    key: object | string,
    defaultValue: () => Readonly<Promise<TValue>>,
    events?: CacheEvents<TValue>
  ) => Readonly<Promise<TValue>>;

  /**
   * Sets the given value with the given `key`.
   */
  readonly set: <TValue>(key: object | string, value: TValue) => Readonly<Promise<TValue>>;

  /**
   * Deletes the given `key`.
   */
  readonly delete: (key: object | string) => Readonly<Promise<void>>;

  /**
   * Clears the cache.
   */
  readonly clear: () => Readonly<Promise<void>>;

  /**
   * Retrieve the entries currently in cache.
   */
  readonly entries: () => Readonly<Promise<unknown>>;
};
