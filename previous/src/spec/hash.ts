import { U } from "./number.ts";

export const IV = /* @__PURE__ */ Uint32Array.from(
  /* @__PURE__ */ "428a2f9871374491b5c0fbcfe9b5dba53956c25b59f111f1923f82a4ab1c5ed5d807aa9812835b01243185be550c7dc372be5d7480deb1fe9bdc06a7c19bf174e49b69c1efbe47860fc19dc6240ca1cc2de92c6f4a7484aa5cb0a9dc76f988da983e5152a831c66db00327c8bf597fc7c6e00bf3d5a7914706ca63511429296727b70a852e1b21384d2c6dfc53380d13650a7354766a0abb81c2c92e92722c85a2bfe8a1a81a664bc24b8b70c76c51a3d192e819d6990624f40e3585106aa07019a4c1161e376c082748774c34b0bcb5391c0cb34ed8aa4a5b9cca4f682e6ff3748f82ee78a5636f84c878148cc7020890befffaa4506cebbef9a3f7c67178f2ca273eced186b8c7eada7dd6f57d4f7f06f067aa0a637dc5113f98041b710b3528db77f532caab7b3c9ebe0a431d67c44cc5d4be597f299c5fcb6fab6c44198cd728ae2223ef65cdec4d3b2f8189dbbcf348b538b605d019af194f9bda6d8118a303024245706fbe4ee4b28cd5ffb4e2f27b896f3b1696b125c71235cf6926949ef14ad2384f25e38b8cd5b577ac9c65592b02756ea6e483bd41fbd4831153b5ee66dfab2db4321098fb213fbeef0ee43da88fc2930aa725e003826f0a0e6e7046d22ffc5c26c9265ac42aed9d95b3df8baf63de3c77b2a847edaee61482353b4cf10364bc423001d0f897910654be30d6ef52185565a9105771202a32bbd1b8b8d2d0c85141ab53df8eeb99e19b48a8c5c95a63e3418acb7763e373d6b2b8a35defb2fc43172f60a1f0ab721a6439ec23631e28de82bde9b2c67915e372532bea26619c21c0c207cde0eb1eee6ed17872176fbaa2c898a6bef90dae131c471b23047d8440c7249315c9bebc9c100d4ccb3e42b6fc657e2a3ad6faec4a4758176a09e667f3bcc908bb67ae8584caa73b3c6ef372fe94f82ba54ff53a5f1d36f1510e527fade682d19b05688c2b3e6c1f1f83d9abfb41bd6b5be0cd19137e21796a09e667bb67ae853c6ef372a54ff53a510e527f9b05688c1f83d9ab5be0cd1976543210fedcba986df984ae357b20c1df250c8b491763eaebcd13978f04a562fa427509d386cb1e38b0a6c291ef57d4a4def15cb8293670931ce7bda2684f05803b9ef65a417d2c5167482a0dc3e9bfd951c840fb73ea62cb61fa50e943d872"
    .match(/.{8}/g)!,
  (Z) => parseInt(Z, 16),
);
export const oaat = (key: Uint8Array, seed: number) => {
  let a = seed ^ 15104, b = seed << 15 | seed >>> 17, z = 0;
  while (z < key.length) {
    a = (a + key[z++]) * 9 | 0, b = b - a | 0, a = a << 7 | a >>> 25;
  }
  return (a ^ b) >>> 0;
};
export const mph = (keys: Uint8Array[]) => {
  const a = keys.length, b = a >>> 2 || 1, c = new Uint32Array(b);
  let z = b;
  do c[--z] = z; while (z);
  const d = new Uint8Array(a), e = Array<Uint8Array[]>(b);
  const f = new Uint32Array(b + 1);
  z: for (let z = 0, y, x, w, g, h, i, j: number[], k; z < 16; ++z) {
    for (y = 0; y < b; ++y) e[y] = [];
    for (y = 0; y < a; ++y) d[y] = 0, e[oaat(g = keys[y], z) % b].push(g);
    y: for (y = 0, c.sort((A, B) => e[B].length - e[A].length); y < b; ++y) {
      x: for (x = 0, i = (h = e[c[y]]).length; x < U; ++x) {
        for (w = 0, j = []; w < i; j.push(k), ++w) {
          if (d[k = oaat(h[w], x) % a] || j.includes(k)) continue x;
        }
        for (w = 0, f[c[y]] = x; w < i; ++w) d[j[w]] = 1;
        continue y;
      }
      continue z;
    }
    f[b] = z | a << 4;
    return f;
  }
  throw Error();
};
export const query = (seed: Uint32Array, key: Uint8Array) => {
  const Z = seed.length - 1, b = seed[Z];
  return oaat(key, seed[oaat(key, b & 0xf) % Z]) % (b >>> 4) || 0;
};
