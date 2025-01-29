// rfc8439 2.5, w.wiki/8NMG
const P = 0x3fffffffffffffffffffffffffffffffbn, N = 1n << 128n;
const u_i = (a: Uint8Array) =>
  BigInt((a[0] | a[1] << 8 | a[2] << 16 | a[3] << 24) >>> 0)
  | BigInt((a[4] | a[5] << 8 | a[6] << 16 | a[7] << 24) >>> 0) << 32n
  | BigInt((a[8] | a[9] << 8 | a[10] << 16 | a[11] << 24) >>> 0) << 64n
  | BigInt((a[12] | a[13] << 8 | a[14] << 16 | a[15] << 24) >>> 0) << 96n;
export default (key: Uint8Array, data: Uint8Array) => {
  const r = u_i(key) & 0x0ffffffc0ffffffc0ffffffc0fffffffn;
  const s = u_i(key.subarray(16)), Z = data.length, Y = Z - Z % 16;
  let a = 0n, x = 0, b = new Uint8Array(16), c, d;
  while (x < Y) a = (a + (u_i(data.subarray(x, x += 16)) | N)) * r % P;
  if (Y < Z) {
    for (c = d = 0n; x < Z; ++x, d += 8n) c |= BigInt(data[x]) << d;
    a = (a + (c | 1n << d)) * r % P;
  }
  for (x = 0, a += s; x < 16; ++x, a >>= 8n) b[x] = Number(a & 255n);
  return b;
};
