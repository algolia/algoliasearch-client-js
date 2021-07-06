// @MAJOR: export this as individual constants, so it can be minified

export const AuthMode = {
  /**
   * If auth credentials should be in query parameters.
   */
  WithinQueryParameters: 0,

  /**
   * If auth credentials should be in headers.
   */
  WithinHeaders: 1,
} as const;

export type AuthModeType = typeof AuthMode[keyof typeof AuthMode];
