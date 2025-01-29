import { sign, verify } from "./25519.ts";
import { b_s, b_s64_0, b_s64_1, s64_b_0, s64_b_1, s_b } from "./encoding.ts";

const TOKEN = /^(eyJhbGciOiJFZERTQSJ9\.(eyJ[-\w]{160,}))\.([-\w]{86})$/;
const HEADER = TOKEN.source.slice(2, 22);
const CLAIMS =
  /^\{"iss":"([-\w]{43})","sub":"([-\w]{43})","ctx":"([-\w]*)","exp":(\d+(?:\.\d+)?)\}$/;
const enum Code {
  INVALID_REQUEST = 400,
  INVALID_TOKEN = 401,
  INSUFFICIENT_SCOPE = 403,
}
export type JWT = {
  iss: Uint8Array;
  sub: Uint8Array;
  ctx: string;
  exp: number;
};
export const entoken = (secret_key: Uint8Array, jwt: JWT) => {
  const a = HEADER + "." + b_s64_1(s_b(JSON.stringify({
    iss: b_s64_0(jwt.iss),
    sub: b_s64_0(jwt.sub),
    ctx: b_s64_1(s_b(jwt.ctx)),
    exp: jwt.exp,
  })));
  return `${a}.${b_s64_0(sign(secret_key, s_b(a)))}`;
};
export const detoken = (token: string) => {
  const a = TOKEN.exec(token);
  if (!a) return Code.INVALID_REQUEST;
  const b = CLAIMS.exec(b_s(s64_b_1(a[2])));
  if (!b) return Code.INVALID_REQUEST;
  const c = +b[4];
  if (c - Date.now() / 1000 < -900) return Code.INVALID_TOKEN;
  const d = s64_b_0(b[1]);
  if (!verify(d, s_b(a[1]), s64_b_0(a[3]))) return Code.INSUFFICIENT_SCOPE;
  return {
    iss: d,
    sub: s64_b_0(b[2]),
    ctx: b_s(s64_b_1(b[3])),
    exp: c,
  } satisfies JWT;
};
