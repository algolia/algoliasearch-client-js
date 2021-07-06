export type InMemoryCacheOptions = {
  /**
   * If keys and values should be serialized using `JSON.stringify`.
   */
  readonly serializable?: boolean;

  /**
   * Cache to initialize the cache with, usually retrieved with cache.entries()
   */
  readonly initialCache?: Record<string, any>;
};
