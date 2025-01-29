// rfc7748 4.1-5, 6.1
import { b62_i, i_b62 } from "../text/base.ts";

export const PUBLIC_KEY = "UsunEI90cz0KvIEjn9zvH087ShjuHLlcw57N52TSRFA";
const p = 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffedn,
  a24 = 121665n,
  F = ~(1n << 255n),
  U = 0xffffffffffffffffn,
  m = (a: bigint, b = a) => a * b % p,
  v = (a: bigint, b: bigint, c: bigint) => 0n - a & (b ^ c),
  q = (a: bigint, b: bigint) => {
    do a = m(a); while (--b);
    return a;
  };
const ladder = (a: string, b: string) => {
  const k = b62_i(a) & -8n & F | 1n << 254n, u = b62_i(b) & F;
  let c = 1n, d = 0n, e = u, f = 1n, g = 0n, h, i, z = 254n;
  do {
    c ^= h = v(i = g ^ (g = k >> z & 1n), c, e), d ^= i = v(i, d, f), e ^= h;
    f = m(u, m((i = m(e - (f ^= i), h = c + d)) - (e = m(e + f, d = c - d))));
    e = m(i + e), c = m(i = m(h), d = m(d)), d = m(d = i - d, i + m(d, a24));
  } while (z--);
  c ^= v(g, c, e), d ^= v(g, d, f), f = m(d, m(d)), e = q(m(q(f, 2n), f), 1n);
  e = m(d, e), e = m(e, q(e, 5n)), g = m(e, q(e, 10n)), g = m(g, q(g, 20n));
  g = m(g, q(g, 40n)), g = q(m(e, q(m(g, q(m(g, q(g, 80n)), 80n)), 10n)), 2n);
  return (g = m(c, m(f, q(m(d, g), 3n)))) < 0n && (g += p), g & F;
};
export const scalar = () => {
  const a = crypto.getRandomValues(new BigUint64Array(4));
  return i_b62(a[0] | a[1] << 64n | a[2] << 128n | a[3] << 192n, 43);
};
export const point = (a: string) => i_b62(ladder(a, "9"), 43);
export default (a: string, A: string, B: string) => {
  const c = ladder(a, B), d = new BigUint64Array(4), e = new Uint8Array(43);
  for (let x = 0; x < 43; ++x) e[x] = A.charCodeAt(x) ^ B.charCodeAt(x);
  d[0] = c & U, d[1] = c >> 64n & U, d[2] = c >> 128n & U, d[3] = c >> 192n & U; // dprint-ignore
  return crypto.subtle.importKey("raw", d, "HKDF", false, ["deriveBits"]).then(a =>
    crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", info: e, salt: new Uint8Array([21,137,244,108,29,121,246,18,219,146,5,109,19,181,241,169,60,207,138,62,206,4,82,196,45,237,184,6,116,37,206,6]) }, a, 256)
  );
};
