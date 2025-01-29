import { poly } from "./poly.ts";
import { chacha, hchacha } from "./xchacha.ts";

const xor = (key: DataView, iv: DataView, text: Uint8Array, to: Uint8Array) => {
  const a = iv.getUint32(16, true), b = iv.getUint32(20, true), c = text.length;
  const d = c & ~63, e = new Uint32Array(16);
  let f = new DataView(to.buffer), z = 0, y = 0, x;
  while (z < d) {
    chacha(key, ++y, x = 0, a, b, e);
    do f.setUint32(
      z,
      (text[z++] | text[z++] << 8 | text[z++] << 16 | text[z++] << 24) ^ e[x],
      true,
    ); while (++x < 16);
  }
  if (d < c) {
    f = new DataView(e.buffer), chacha(key, y + 1, x = 0, a, b, e);
    do to[z] = text[z] ^ f.getUint8(x++); while (++z < c);
  }
};
const tag = (key: Uint32Array, additional: Uint8Array, text: Uint8Array) => {
  const a = new DataView(key.buffer), b = additional.length, c = text.length;
  const d = b + 15 & ~15, e = d + c + 15 & ~15, f = new Uint8Array(e + 16);
  f.set(additional), f.set(text, d), f[e] = b, f[e + 1] = b >> 8;
  f[e + 2] = b >> 16, f[e + 3] = b >> 24, f[e + 8] = c, f[e + 9] = c >> 8;
  return f[e + 10] = c >> 16, f[e + 11] = c >> 24, poly(a, f);
};
export const xchacha_poly = (
  key: Uint8Array,
  nonce: Uint8Array,
  text: Uint8Array,
  data: Uint8Array,
) => {
  if (key.length !== 32 || nonce.length !== 24) return new Uint8Array();
  const a = new Uint32Array(16), b = new DataView(nonce.buffer);
  const c = hchacha(a, new DataView(key.buffer), b);
  chacha(c, 0, 0, b.getUint32(16, true), b.getUint32(20, true), a);
  const d = text.length, e = new Uint8Array(d + 16);
  return xor(c, b, text, e), e.set(tag(a, data, e.subarray(0, d)), d), e;
};
export const poly_xchacha = (
  key: Uint8Array,
  nonce: Uint8Array,
  text: Uint8Array,
  data: Uint8Array,
) => {
  if (key.length !== 32 || nonce.length !== 24) return false;
  const a = new Uint32Array(16), b = new DataView(nonce.buffer);
  const c = hchacha(a, new DataView(key.buffer), b), d = text.length - 16;
  chacha(c, 0, 0, b.getUint32(16, true), b.getUint32(20, true), a);
  const e = new Uint8Array(d), f = tag(a, data, text.subarray(0, d));
  let z = 16, y = 0;
  do y |= f[--z] ^ text[d + z]; while (z);
  return !y && (xor(c, b, text.subarray(0, d), e), e);
};
export const encrypt = (
  key: Uint8Array,
  text: Uint8Array,
  data = new Uint8Array(),
) => {
  const a = crypto.getRandomValues(new Uint8Array(24));
  const b = xchacha_poly(key, a, text, data), c = new Uint8Array(b.length + 24);
  return c.set(a), c.set(b, 24), c;
};
export const decrypt = (
  key: Uint8Array,
  text: Uint8Array,
  data = new Uint8Array(),
) => poly_xchacha(key, text.subarray(0, 24), text.subarray(24), data);
