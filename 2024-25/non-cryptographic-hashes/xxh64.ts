const b64 = (a: Uint8Array, z: number) =>
    BigInt(a[z] | a[z + 1] << 8 | a[z + 2] << 16 | a[z + 3] << 24) |
    BigInt(a[z + 4] | a[z + 5] << 8 | a[z + 6] << 16 | a[z + 7] << 24) << 32n,
  b32 = (a: Uint8Array, z: number) =>
    BigInt(a[z] | a[z + 1] << 8 | a[z + 2] << 16 | a[z + 3] << 24),
  l64 = (a: bigint, b: bigint) => a << b | a >> 64n - b,
  F = 0x9e3779b185ebca87n,
  G = 0xc2b2ae3d27d4eb4fn,
  H = 0x165667b19e3779f9n,
  I = 0x85ebca77c2b2ae63n,
  J = 0x27d4eb2f165667c5n,
  r64 = (a: bigint, b: bigint) => l64(a + b * G, 31n) * F,
  m64 = (a: bigint, b: bigint) => (a ^ r64(0n, b)) * F + I;
export const xxh64 = (a: Uint8Array, b = 0n) => {
  let c, z = 0, Z = a.length, Y = Z - 4, X = Z - 8;
  if (Z > 31) {
    let W = Z - 31, d = b + G, e = d + F, f = b, g = b - F;
    do e = r64(e, b64(a, z)),
      d = r64(d, b64(a, z += 8)),
      f = r64(f, b64(a, z += 8)),
      g = r64(g, b64(a, z += 8)); while ((z += 4) < W);
    c = l64(e, 1n) + l64(d, 7n) + l64(f, 12n) + l64(g, 18n);
    c = m64(m64(m64(m64(c, e), d), f), g) + BigInt(Z);
  } else c = b + J + BigInt(Z);
  while (z < X) c = l64(c ^ r64(0n, b64(a, z)), 27n) * F + I, z += 8;
  while (z < Y) c = l64(c ^ b32(a, z) * F, 23n) * G + H, z += 4;
  while (z < Z) c = l64(c ^ BigInt(a[z++]) * J, 11n) * F;
  c = (c ^ c >> 33n) * G, c = (c ^ c >> 29n) * H, c ^ c >> 32n;
  return new Uint8Array([
    Number(c & 255n),
    Number(c >> 8n & 255n),
    Number(c >> 16n & 255n),
    Number(c >> 24n & 255n),
    Number(c >> 32n & 255n),
    Number(c >> 40n & 255n),
    Number(c >> 48n & 255n),
    Number(c >> 56n & 255n),
  ]);
};
