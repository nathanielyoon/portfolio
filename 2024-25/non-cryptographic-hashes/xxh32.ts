const n = (a: Uint8Array, z: number) =>
    a[z - 4] | a[z - 3] << 8 | a[z - 2] << 16 | a[z - 1] << 24,
  l = (a: number, b: number) => a << b | a >>> 32 - b,
  A = 0x9e3779b1,
  B = 0x85ebca77,
  C = 0xc2b2ae3d,
  D = 0x27d4eb2f,
  E = 0x165667b1;
export default (key: Uint8Array, seed: number) => { // xxhash.com
  let Z = ~~key.length, Y = Z - 4, z = 0, a = ~~seed;
  if (Z > 15) {
    let X = Z - 15, b = a + B, c = b + A, d = a - A;
    do c = Math.imul(A, l(c + Math.imul(B, n(key, z += 4)), 13)),
      b = Math.imul(A, l(b + Math.imul(B, n(key, z += 4)), 13)),
      a = Math.imul(A, l(a + Math.imul(B, n(key, z += 4)), 13)),
      d = Math.imul(A, l(d + Math.imul(B, n(key, z += 4)), 13)); while (z < X);
    a = l(c, 1) + l(b, 7) + l(a, 12) + l(d, 18) + Z;
  } else a += E + Z;
  while (z < Y) a = Math.imul(D, l(a + Math.imul(C, n(key, z += 4)), 17));
  while (z < Z) a = Math.imul(A, l(a + Math.imul(E, key[z++]), 11));
  a = Math.imul(a ^ a >>> 15, B), a = Math.imul(a ^ a >>> 13, C);
  return (a ^ a >>> 16) >>> 0;
};
