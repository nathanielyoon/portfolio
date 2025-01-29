import { b_s, type U8, u8 } from "./bits.ts";

// deno-fmt-ignore
const EC = { name: "ECDSA", namedCurve: "P-256" }, DSA = { name: "ECDSA", hash: "SHA-256" },
  p = 115792089210356248762697446949407573530086143415290314195533631308867097853951n,
  a = 115792089210356248762697446949407573530086143415290314195533631308867097853948n,
  b = 41058363725152142129326129780047268409114441015993725554835256314039467401291n,
  n = 115792089210356248762697446949407573529996955224135760342422259061068512044369n,
  Gx = 48439561293906451759052585252797914202762949526041747995844080717082404635286n,
  Gy = 36134250956749795798585127919587881956611106672985015071877198253568414405109n,
  R = 28948022302589062190674361737351893382521535853822578548883407827216774463488n,
  M = 57896044605178124381348723474703786765043071707645157097766815654433548926975n;
const enbig = (bytes: U8, z = 0n, i = bytes.length, j = 0n) => {
  while (i > 0) z |= BigInt(bytes[--i]) << j, j += 8n;
  return z;
};
const debig = (big: bigint, end = 32, z = u8(end)) => {
  while (big > 0n) z[--end] = Number(big & 255n), big >>= 8n;
  return z;
};
const m = (z: bigint, modulus = p) => (z %= modulus) >= 0n ? z : modulus + z;
const x = (l: bigint, p: bigint, q: bigint) => m(m(m(l * l) + m(-p)) + m(-q));
const l = (top: bigint, bot: bigint) => {
  let a = m(m(bot, p)), b = p, z = 0n, c = 1n, d = 1n, e = 0n;
  for (let f, g, h, i; a !== 0n; b = a, a = g, z = d, c = e, d = h, e = i) {
    f = b / a, g = b % a, h = z - d * f, i = c - e * f;
  }
  return m(m(top) * m(z));
};
const multiply = (scalar: bigint, x2 = 0n, y2 = 0n) => {
  for (let x1 = Gx, y1 = Gy, t; scalar > 0n; scalar >>= 1n) {
    (scalar & 1n) && (x1 !== 0n || y1 !== 0n) &&
      (x2 === 0n && y2 === 0n
        ? (x2 = x1, y2 = y1)
        : (t = l(y1 + m(-y2), x1 + m(-x2)),
          y2 = m(m(t * m(x2 + m(-(x2 = x(t, x2, x1))))) + m(-y2))));
    t = l(a + m(3n * m(x1 * x1)), 2n * y1);
    y1 = m(m(t * m(x1 + m(-(x1 = x(t, x1, x1))))) + m(-y1));
  }
  return [x2, y2];
};
export const generate = () => {
  const r = crypto.getRandomValues(new BigUint64Array(4));
  const d = m(r[0] | r[1] << 64n | r[2] << 128n | r[3] << 192n, n - 1n) + 1n;
  return debig(multiply(d)[1] > M ? n - d : d);
};
export const derive = (d: U8) => debig(multiply(enbig(d))[0]);
export const sign = (d: U8, data: U8) => {
  const ec = multiply(enbig(d)), x = b_s(debig(ec[0])), y = b_s(debig(ec[1]));
  const jwk = { kty: "EC", crv: "P-256", d: b_s(d), x, y };
  return crypto.subtle.importKey("jwk", jwk, EC, true, ["sign"])
    .then((key) => crypto.subtle.sign(DSA, key, data)).then(u8);
};
export const verify = (x: U8, signature: U8, data: U8) => {
  const into = u8(65), x1 = enbig(x);
  let it = m(m(m(x1 * m(x1 * x1)) + m(x1 * a)) + b), to = R, y = 1n;
  do to & 1n && (y = m(y * it)), it = m(it * it); while (to >>= 1n);
  into.set([4]), into.set(x, 1), into.set(debig(y > M ? m(-y) : y), 33);
  return crypto.subtle.importKey("raw", into, EC, true, ["verify"])
    .then((key) => crypto.subtle.verify(DSA, key, signature, data));
};
const name = "ECDH", ECDH = { name: "ECDH", namedCurve: "P-256" };
export const dh2 = (d: U8, B: U8) => {
  const ec = multiply(enbig(d)), x1 = b_s(debig(ec[0])), y1 = b_s(debig(ec[1]));
  const A = { kty: "EC", crv: "P-256", d: b_s(d), x: x1, y: y1 };
  const into = u8(65), x2 = enbig(B);
  let it = m(m(m(x2 * m(x2 * x2)) + m(x2 * a)) + b), to = R, y2 = 1n;
  do to & 1n && (y2 = m(y2 * it)), it = m(it * it); while (to >>= 1n);
  into.set([4]), into.set(B, 1), into.set(debig(y2 > M ? m(-y2) : y2), 33);
  return Promise.all([
    crypto.subtle.importKey("jwk", A, ECDH, true, ["deriveBits"]),
    crypto.subtle.importKey("raw", into, ECDH, true, []),
  ]).then((b) => crypto.subtle.deriveBits({ name, public: b[1] }, b[0], 256));
};
