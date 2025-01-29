import { b64_n, b64_u, i_u, n_b64, u_b64, u_i } from "./base.ts";

const n = (a: Uint8Array, z: number) =>
    a[z - 4] | a[z - 3] << 8 | a[z - 2] << 16 | a[z - 1] << 24,
  l = (a: number, b: number) => a << b | a >>> 32 - b,
  A = 0x9e3779b1, // github.com/Cyan4973/xxHash/blob/dev/xxhash.h#L2833
  B = 0x85ebca77,
  C = 0xc2b2ae3d,
  D = 0x27d4eb2f,
  E = 0x165667b1,
  x = (a: number, b: number) => Math.imul(A, l(a + Math.imul(E, b), 11)),
  f = (a: number) => {
    a = Math.imul(a ^ a >>> 15, B), a = Math.imul(a ^ a >>> 13, C);
    return (a ^ a >>> 16) >>> 0;
  },
  m = (hash: number, seed: number) =>
    f(x(
      x(x(x(seed + E + 4, hash & 0xff), hash >> 8 & 0xff), hash >> 16 & 0xff),
      hash >> 24 & 0xff,
    )); // unrolled loop on last 4 bytes
export const xxh32 = (key: Uint8Array, seed: number) => { // xxhash.com
  let Z = ~~key.length, Y = Z - 4, z = 0, a = ~~seed; // these little no-op nots make it ~20% faster (on 32-byte keys)
  if (Z > 15) {
    let X = Z - 15, b = a + B, c = b + A, d = a - A;
    do c = Math.imul(A, l(c + Math.imul(B, n(key, z += 4)), 13)),
      b = Math.imul(A, l(b + Math.imul(B, n(key, z += 4)), 13)),
      a = Math.imul(A, l(a + Math.imul(B, n(key, z += 4)), 13)),
      d = Math.imul(A, l(d + Math.imul(B, n(key, z += 4)), 13)); while (z < X);
    a = l(c, 1) + l(b, 7) + l(a, 12) + l(d, 18) + Z;
  } else a += E + Z;
  while (z < Y) a = Math.imul(D, l(a + Math.imul(C, n(key, z += 4)), 17));
  while (z < Z) a = x(a, key[z++]);
  return f(a);
};
const size = (a: number) => 1 << Math.ceil(Math.log2(a)); // round up to nearest power of 2, if not externally defined
export const compress = (all: Uint8Array[], max = size(all.length)) => { // w.wiki/8NMD
  const Z = all.length, Y = max - 1, X = max >> 3 || 1, W = X - 1, a = Array(X);
  z: for (let z = 0, y, x, w, V, b, c, d, e, f, g; z < 10; ++z) { // if you can't find unique initial hashes after 9 seeds, the set's too big (unlikely)
    for (y = 0, b = new Uint32Array(X); y < X; ++y) a[b[y] = y] = [];
    for (y = 0, c = Array<number>(Z); y < Z; a[d & W].push(c[y++] = d)) {
      if (c.includes(d = xxh32(all[y], z))) continue z;
    }
    c = new Uint8Array(max), d = new Uint32Array(X);
    y: for (y = 0, b.sort((e, f) => a[f].length - a[e].length); y < X; ++y) {
      x: for (x = 0, V = (e = a[b[y]]).length; x < 0xffffffff; ++x) {
        for (w = 0, f = Array<number>(V); w < V; f[w++] = g) {
          if (c[g = m(e[w], x) & Y] || f.includes(g)) continue x; // this bucket's seed leads to collisions
        }
        for (w = 0, d[b[y]] = x; w < V; ++w) c[f[w]] = 1;
        continue y; // next bucket
      }
      continue z; // the initial seed exhausts this bucket (extremely unlikely), try the next
    }
    for (y = b = 0, e = f = 0n; y < X; ++y) if ((c = d[y]) > b) b = c; // find base for encoding
    for (y = 0, c = BigInt(++b); y < X; ++y) e += BigInt(d[y]) * c ** f++;
    return n_b64(max) + z + n_b64(b) + u_b64(i_u(e));
  }
  throw Error(":("); // should never happen
};
export const decompress = (a: string) => {
  const b = b64_n(a), c = BigInt(b64_n(a.slice(7))), Z = b >> 3 || 1;
  let d = u_i(b64_u(a.slice(13))), e = new Uint32Array(Z + 2), z = 0;
  while (d && z < Z) e[z++] = Number(d % c), d /= c;
  return e[Z] = b, e[Z + 1] = +a[6], e;
};
export const hash = (base: Uint32Array, data: Uint8Array) => {
  const Z = base.length, a = xxh32(data, base[Z - 1]), b = base[Z - 2];
  return m(a, base[a & (b >> 3 || 1) - 1]) & b - 1;
};
