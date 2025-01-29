export const base91 = /^[!-&(-,.-\[\]-~]*$/;
const A =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
const B = new Uint8Array(256);
for (let z = 0; z < 91; ++z) B[A.charCodeAt(z)] = z;
export const a_s91 = (bytes: Uint8Array) => {
  let a = "", b = 0, c = 0;
  for (let z = 0, d, e; z < bytes.length; ++z) {
    b |= bytes[z] << c, c += 8;
    if (c > 13) {
      b >>= e = (d = b & 0x1fff) > 88 ? 13 : (d |= b & 0x2000, 14);
      c -= e, a += A[d % 91] + A[d / 91 | 0];
    }
  }
  if (c > 7 || b > 90) a += A[b % 91] + A[b / 91 | 0];
  else if (c) a += A[b % 91];
  return a;
};
export const s91_a = (base91: string) => {
  const a = base91.length, b = a & ~1, c = new Uint8Array(a << 1);
  let d = 0, e = 0, f, z = 0, y = 0;
  while (z < b) {
    f = B[base91.charCodeAt(z++)] + 91 * B[base91.charCodeAt(z++)];
    d |= f << e, e += (f & 0x1fff) > 88 ? 13 : 14;
    do c[y++] = d, d >>= 8, e -= 8; while (e > 7);
  }
  if (a > b) c[y++] = d | B[base91.charCodeAt(b)] << e;
  return new Uint8Array(c.subarray(0, y));
};
