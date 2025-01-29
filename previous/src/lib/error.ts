export const enum Code {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  UNSUPPORTED_MEDIA_TYPE = 415,
  UNPROCESSABLE_CONTENT = 422,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  LOOP_DETECTED = 508,
}
export class Err<A = unknown> extends Error {
  static ok<A>(ok: unknown, no: { [_: string]: Err }) {
    if (Object.keys(no).length) throw new Err(Code.UNPROCESSABLE_CONTENT, no);
    return <A> ok;
  }
  static never(cause?: unknown, message = "UNREACHABLE"): never {
    throw new Err(Code.BAD_REQUEST, cause, message);
  }
  static catch(thrown: unknown) {
    if (thrown instanceof Err) return thrown;
    throw thrown;
  }
  static not(cause: unknown): never {
    throw new Err(404, cause);
  }
  declare cause: A;
  constructor(code: Code.BAD_REQUEST, cause: unknown, message: string);
  constructor(
    code: Exclude<Code, Code.BAD_REQUEST>,
    cause: unknown,
    message?: string,
  );
  constructor(public code: Code, cause: A, message?: string) {
    super(message, { cause });
  }
  toJSON() {
    return {
      code: this.code,
      cause: this.cause,
      message: this.message,
      stack: this.stack,
    };
  }
}
