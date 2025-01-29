const C = 0x0ffffffc0ffffffc0ffffffc0fffffffn,
  P = 2n ** 130n - 5n,
  N = 1n << 128n,
  s = (a: number) => (a + 15) & -16;
const u16_i = (a: Uint8Array) =>
  BigInt((a[0] | a[1] << 8 | a[2] << 16 | a[3] << 24) >>> 0)
  | BigInt((a[4] | a[5] << 8 | a[6] << 16 | a[7] << 24) >>> 0) << 32n
  | BigInt((a[8] | a[9] << 8 | a[10] << 16 | a[11] << 24) >>> 0) << 64n
  | BigInt((a[12] | a[13] << 8 | a[14] << 16 | a[15] << 24) >>> 0) << 96n;
export default (key: Uint8Array, a: Uint8Array, b: Uint8Array) => {
  let Z = a.length, Y = s(Z), X = b.length, W = s(X), z, c, d, e, f, g, h;
  (d = new Uint8Array(c = Y + W + 16)).set(b), d.set(a, W), Y = (W += Y) + 16;
  for (z = 0, e = new Uint8Array(16), f = 0n; (Z || X) && z < 16; ++z) {
    d[W + z] = X & 255, d[Y + z] = Z & 255, X >>= 8, Z >>= 8;
  }
  g = u16_i(key) & C, key = key.subarray(16), z = 0, Y = (Z = c) - c % 16;
  while (z < Y) f = (f + (u16_i(d.subarray(z, z += 16)) | N)) * g % P;
  if (Y < Z) {
    for (c = h = 0n; z < Z; ++z, h += 8n) c |= BigInt(d[z]) << h;
    f = (f + (c | 1n << h)) * g % P;
  }
  for (z = 0, f += u16_i(key); z < 16; ++z, f >>= 8n) e[z] = Number(f & 255n);
  return e;
};
