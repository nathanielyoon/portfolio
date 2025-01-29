import { IV } from "./hash.ts";
import { b_b32, min, U } from "./number.ts";

const enum Size {
  BLOCK = 64,
  CHUNK = 1024,
}
const enum Flag {
  START = 1,
  END = 2,
  PARENT = 4,
  ROOT = 8,
  KEYED = 16,
  DERIVE_CONTEXT = 32,
  DERIVE_KEY = 64,
}
const A = IV.subarray(176, 184);
const B = Uint8Array.from(
  "0123456789abcdef263a704d1bc59ef834acd27e6590bf81a7c9e3df40b25816cd9bfae8725301649eb58cf1d30a2647bf501986ea2c347d",
  (Z) => parseInt(Z, 16) << 2,
);
export const compress = (
  state: Uint32Array,
  view: DataView,
  at: number,
  byte: number,
  flag: number,
  to: Uint32Array,
) => {
  let a = state[0], b = state[1], c = state[2], d = state[3], e = state[4];
  let f = state[5], g = state[6], h = state[7], i = A[0], j = A[1], k = A[2];
  let l = A[3], m = at, n = at / U, o = byte, p = flag, z = 0;
  do m ^= a = a + e + view.getUint32(B[z++], true) | 0,
    m = m << 16 | m >>> 16,
    e ^= i = i + m | 0,
    e = e << 20 | e >>> 12,
    m ^= a = a + e + view.getUint32(B[z++], true) | 0,
    m = m << 24 | m >>> 8,
    e ^= i = i + m | 0,
    e = e << 25 | e >>> 7,
    n ^= b = b + f + view.getUint32(B[z++], true) | 0,
    n = n << 16 | n >>> 16,
    f ^= j = j + n | 0,
    f = f << 20 | f >>> 12,
    n ^= b = b + f + view.getUint32(B[z++], true) | 0,
    n = n << 24 | n >>> 8,
    f ^= j = j + n | 0,
    f = f << 25 | f >>> 7,
    o ^= c = c + g + view.getUint32(B[z++], true) | 0,
    o = o << 16 | o >>> 16,
    g ^= k = k + o | 0,
    g = g << 20 | g >>> 12,
    o ^= c = c + g + view.getUint32(B[z++], true) | 0,
    o = o << 24 | o >>> 8,
    g ^= k = k + o | 0,
    g = g << 25 | g >>> 7,
    p ^= d = d + h + view.getUint32(B[z++], true) | 0,
    p = p << 16 | p >>> 16,
    h ^= l = l + p | 0,
    h = h << 20 | h >>> 12,
    p ^= d = d + h + view.getUint32(B[z++], true) | 0,
    p = p << 24 | p >>> 8,
    h ^= l = l + p | 0,
    h = h << 25 | h >>> 7,
    p ^= a = a + f + view.getUint32(B[z++], true) | 0,
    p = p << 16 | p >>> 16,
    f ^= k = k + p | 0,
    f = f << 20 | f >>> 12,
    p ^= a = a + f + view.getUint32(B[z++], true) | 0,
    p = p << 24 | p >>> 8,
    f ^= k = k + p | 0,
    f = f << 25 | f >>> 7,
    m ^= b = b + g + view.getUint32(B[z++], true) | 0,
    m = m << 16 | m >>> 16,
    g ^= l = l + m | 0,
    g = g << 20 | g >>> 12,
    m ^= b = b + g + view.getUint32(B[z++], true) | 0,
    m = m << 24 | m >>> 8,
    g ^= l = l + m | 0,
    g = g << 25 | g >>> 7,
    n ^= c = c + h + view.getUint32(B[z++], true) | 0,
    n = n << 16 | n >>> 16,
    h ^= i = i + n | 0,
    h = h << 20 | h >>> 12,
    n ^= c = c + h + view.getUint32(B[z++], true) | 0,
    n = n << 24 | n >>> 8,
    h ^= i = i + n | 0,
    h = h << 25 | h >>> 7,
    o ^= d = d + e + view.getUint32(B[z++], true) | 0,
    o = o << 16 | o >>> 16,
    e ^= j = j + o | 0,
    e = e << 20 | e >>> 12,
    o ^= d = d + e + view.getUint32(B[z++], true) | 0,
    o = o << 24 | o >>> 8,
    e ^= j = j + o | 0,
    e = e << 25 | e >>> 7; while (z < 112);
  to[0] = a ^ i, to[1] = b ^ j, to[2] = c ^ k, to[3] = d ^ l;
  to[4] = e ^ m, to[5] = f ^ n, to[6] = g ^ o, to[7] = h ^ p;
  if (flag & Flag.ROOT) {
    to[8] = i ^ state[0], to[9] = j ^ state[1], to[10] = k ^ state[2];
    to[11] = l ^ state[3], to[12] = m ^ state[4], to[13] = n ^ state[5];
    to[14] = o ^ state[6], to[15] = p ^ state[7];
  }
};
const merge = (
  left: Uint32Array,
  right: Uint32Array,
) => (left.set(right.subarray(0, 8), 8), new DataView(left.buffer));
const blake3 = (
  key: Uint32Array,
  flag: number,
  input: Uint8Array,
  out = 32,
  at = 0,
) => {
  const a = [], b = new Uint32Array(key), c = new Uint8Array(Size.BLOCK);
  let d = new DataView(c.buffer), e = 0, f = 0, z = 0, y = 0, x;
  const g = new Uint32Array(16), h = new Uint8Array(out);
  while (z < input.length) {
    if (e + f * Size.BLOCK === Size.CHUNK) {
      for (compress(b, d, y, e, flag | Flag.END, g), x = ++y; -~x & 1; x /= 2) {
        compress(key, merge(a.pop()!, g), 0, Size.BLOCK, flag | Flag.PARENT, g);
      }
      a.push(new Uint32Array(g)), b.set(key), c.fill(e = f = 0);
    }
    const i = min(z + Size.CHUNK - e - f * Size.BLOCK, input.length);
    do e < Size.BLOCK ||
      (compress(b, d, y, e, flag | +!f++ & Flag.START, b), c.fill(e = 0)),
      c.set(input.subarray(z, z += x = min(Size.BLOCK - e, i - z)), e),
      e += x; while (z < i);
  }
  if (x = flag | +!f & Flag.START | Flag.END, z = a.length) {
    compress(b, d, y, e, x, g), x = flag | Flag.PARENT;
    while (--z) compress(key, merge(a[z], g), 0, Size.BLOCK, x, g);
    b.set(key), d = merge(a[0], g), e = Size.BLOCK;
  }
  do {
    compress(b, d, at++, e, x | Flag.ROOT, g), y = min(z + Size.BLOCK, out);
    do h[z] = g[z >> 2 & 15] >> (z << 3); while (++z < y);
  } while (z < out);
  return h;
};
export const blake3_hash = (message: Uint8Array, out?: number) =>
  blake3(A, 0, message, out);
export const blake3_keyed = (
  key: Uint8Array,
  message: Uint8Array,
  out?: number,
) => blake3(b_b32(key), Flag.KEYED, message, out);
export const blake3_derive = (
  context: string,
  message: Uint8Array,
  out?: number,
  seek?: number,
) =>
  blake3(
    b_b32(blake3(A, Flag.DERIVE_CONTEXT, new TextEncoder().encode(context))),
    Flag.DERIVE_KEY,
    message,
    out,
    seek,
  );
