import { IV } from "./hash.ts";
import { min, U } from "./number.ts";

const A = IV.subarray(160, 176);
const md = (
  hash: Uint32Array,
  block: (
    use: Uint32Array,
    view: DataView,
    at: number,
    to: Uint32Array,
  ) => void,
) =>
(message: Uint8Array) => {
  const a = new Uint32Array(hash), b = a.length, c = new Uint32Array(b * 10);
  const d = b << 3, e = new Uint8Array(d), f = message.length;
  let g = new DataView(message.buffer, message.byteOffset), z = 0, y = 0;
  while (z < f) {
    const h = min(d - y, f - z);
    if (h !== d) e.set(message.subarray(z, z += h)), y += h;
    else do block(c, g, z, a); while (f - (z += d) >= d);
  }
  g = new DataView(e.buffer), e[y] = 128, d - ++y < b && block(c, g, y = 0, a);
  e.fill(0, y), g.setBigUint64(d - 8, BigInt(f) << 3n), block(c, g, y = 0, a);
  do g.setUint32(y << 2, a[y]); while (++y < b);
  return new Uint8Array(e.subarray(0, d >> 1));
};
export const sha512 = md(A, (use, view, at, to) => {
  let a = to[1], b = to[2], c = to[3], d = to[4], e, f, g, h, i, j, z = 0;
  do use[z] = view.getUint32(at),
    use[z + 80] = view.getUint32(at + 4),
    at += 8; while (++z < 16);
  do e = use[z - 15],
    f = use[z + 65],
    g = ((f >>> 1 | e << 31) ^ (f >>> 8 | e << 24) ^ (f >>> 7 | e << 25)) >>> 0,
    h = (e >>> 1 | f << 31) ^ (e >>> 8 | f << 24) ^ e >>> 7,
    e = use[z - 2],
    f = use[z + 78],
    use[z + 80] = g += use[z + 73] + use[z + 64] + (((f >>> 19 | e << 13) ^
      (e >>> 29 | f << 3) ^ (f >>> 6 | e << 26)) >>> 0),
    use[z] = h + ((e >>> 19 | f << 13) ^ (f >>> 29 | e << 3) ^ e >>> 6) +
      use[z - 7] + use[z - 16] + (g / U | 0); while (++z < 80);
  let k = to[z = 0], l = to[5], m = to[6], n = to[7], o = to[8], p = to[9];
  let q = to[10], r = to[11], s = to[12], t = to[13], u = to[14], v = to[15];
  do e = (p >>> 9 | o << 23) ^ (o >>> 14 | p << 18) ^ (o >>> 18 | p << 14),
    f = (o >>> 9 | p << 23) ^ (p >>> 14 | o << 18) ^ (p >>> 18 | o << 14),
    i = v + (f >>> 0) + ((p & r ^ ~p & t) >>> 0) + IV[z + 80] + use[z + 80],
    j = e + u + (o & q ^ ~o & s) + IV[z] + use[z] + (i / U | 0) | 0,
    e = (a >>> 2 | k << 30) ^ (a >>> 7 | k << 25) ^ (k >>> 28 | a << 4),
    f = (k >>> 2 | a << 30) ^ (k >>> 7 | a << 25) ^ (a >>> 28 | k << 4),
    g = b & d ^ b & k ^ d & k,
    h = a & c ^ a & l ^ c & l,
    u = s,
    s = q,
    q = o,
    v = t,
    t = r,
    r = p >>> 0,
    p = (i >>> 0) + n,
    o = j + m + (p / U | 0) | 0,
    m = d,
    d = b,
    b = k,
    n = l,
    l = c,
    c = a >>> 0,
    a = (f >>> 0) + (h >>> 0) + (i >>> 0),
    k = (a / U | 0) + e + g + j | 0; while (++z < 80);
  to[0] += k + ((to[1] += a >>> 0) / U | 0);
  to[2] += b + ((to[3] += c) / U | 0), to[10] += q + ((to[11] += r) / U | 0);
  to[4] += d + ((to[5] += l) / U | 0), to[12] += s + ((to[13] += t) / U | 0);
  to[6] += m + ((to[7] += n) / U | 0), to[14] += u + ((to[15] += v) / U | 0);
  to[8] += o + ((to[9] += p >>> 0) / U | 0);
});
export const sha256 = md(A.filter((_, Z) => Z & 1 ^ 1), (use, from, at, to) => {
  let a = to[1], b = to[2], c = to[3], d = to[4], e = to[5], f, g, z = 0;
  do use[z] = from.getUint32(at), at += 4; while (++z < 16);
  do f = use[z - 2],
    g = use[z - 15],
    use[z] = ((g >>> 7 | g << 25) ^ (g >>> 18 | g << 14) ^ g >>> 3) +
      ((f >>> 17 | f << 15) ^ (f >>> 19 | f << 13) ^ f >>> 10) +
      use[z - 7] + use[z - 16]; while (++z < 64);
  let h = to[z = 0], i = to[6], j = to[7];
  do f = ((d >>> 6 | d << 26) ^ (d >>> 11 | d << 21) ^ (d >>> 25 | d << 7)) +
    (d & e ^ ~d & i) + j + IV[z] + use[z],
    g = ((h >>> 2 | h << 30) ^ (h >>> 13 | h << 19) ^ (h >>> 22 | h << 10)) +
      (a & b ^ h & a ^ h & b),
    j = i,
    i = e,
    e = d,
    d = c + f,
    c = b,
    b = a,
    a = h,
    h = f + g; while (++z < 64);
  to[0] += h, to[1] += a, to[2] += b, to[3] += c;
  to[4] += d, to[5] += e, to[6] += i, to[7] += j;
});
export const hmac = (key: Uint8Array, data: Uint8Array) => {
  if (key.length > 64) key = sha256(key);
  const a = key.length + 63 & ~63, b = new Uint8Array(a + data.length).fill(54);
  const c = new Uint8Array(a + 32).fill(92);
  let z = key.length;
  do b[--z] ^= key[z], c[z] ^= key[z]; while (z);
  return b.set(data, a), c.set(sha256(b), a), sha256(c);
};
