// @MAJOR: export this as individual constants, so it can be minified

export const CallEnum = {
  /**
   * If the host is read only.
   */
  Read: 1,

  /**
   * If the host is write only.
   */
  Write: 2,

  /**
   * If the host is both read and write.
   */
  Any: 3,
} as const;

export type CallType = typeof CallEnum[keyof typeof CallEnum];
