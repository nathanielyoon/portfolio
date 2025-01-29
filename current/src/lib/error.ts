/**
 * @module
 *
 * `Error` class wrapper.
 *
 * @see {@linkcode https://dev.mozilla.org/Web/JavaScript/Reference/Global_Objects/Error | Error}
 */

/**
 * HTTP status codes.
 *
 * @see {@link https://dev.mozilla.org/Web/HTTP/Status | Status codes}
 */
export const enum Code {
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  UNPROCESSABLE_CONTENT = 422,
  INTERNAL_SERVER_ERROR = 500,
}

/** `Error` wrapper, requires a status code and an optionally typed cause. */
export class Err<A = unknown> extends Error {
  /** Passed cause, may or may not be typed. */
  declare cause: A;
  /**
   * Create a new `Err` object.
   *
   * @param code Status code.
   * @param cause The value that raised this error.
   * @param message Optional explanation.
   */
  constructor(public code: Code, cause: unknown, message?: string) {
    super(message, { cause });
  }
}
