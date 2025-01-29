export const base64 = /^[-\w]*$/;
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const B = new Uint8Array(256);
for (let z = 0; z < 64; ++z) B[A.charCodeAt(z)] = z;
export const a_s64 = (bytes: Uint8Array) => {
  let a = "", z = 0;
  while (z < bytes.length) {
    const b = bytes[z++] << 16 | bytes[z++] << 8 | bytes[z++];
    a += A[b >> 18] + A[b >> 12 & 63] + A[b >> 6 & 63] + A[b & 63];
  }
  return a.slice(0, Math.ceil((bytes.length << 2) / 3));
};
export const s64_a = (string: string) => {
  const a = new Uint8Array(string.length * 3 >> 2);
  let z = 0, y = 0;
  while (z < string.length) {
    const b = B[string.charCodeAt(z++)] << 18 |
      B[string.charCodeAt(z++)] << 12 | B[string.charCodeAt(z++)] << 6 |
      B[string.charCodeAt(z++)];
    a[y++] = b >> 16, a[y++] = b >> 8, a[y++] = b;
  }
  return a;
};
