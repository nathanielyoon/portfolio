export const s_b: (string: string) => Uint8Array = /* @__PURE__ */ TextEncoder
  .prototype.encode.bind(/* @__PURE__ */ new TextEncoder());
export const b_s: (binary: Uint8Array) => string = /* @__PURE__ */ TextDecoder
  .prototype.decode.bind(/* @__PURE__ */ new TextDecoder());
export const B16 = "0123456789abcdef";
export const B64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export const B95 = Array.from(
  { length: 95 },
  (_, Z) => String.fromCharCode(Z + 32),
).join("");
const A = new Uint8Array(256);
for (let z = 0; z < 64; ++z) A[B64.charCodeAt(z)] = z;
export const b_s64_0 = (binary: Uint8Array) => {
  let a = "", b, z = 0;
  while (z < binary.length) {
    b = binary[z++] << 16 | binary[z++] << 8 | binary[z++];
    a += B64[b >> 18] + B64[b >> 12 & 63] + B64[b >> 6 & 63] + B64[b & 63];
  }
  return a.slice(0, (binary.length << 2) / 3 + .9);
};
export const s64_b_0 = (string: string) => {
  const a = new Uint8Array(string.length * 3 >> 2);
  let b, z = 0, y = 0;
  while (z < string.length) {
    b = A[string.charCodeAt(z++)] << 18 | A[string.charCodeAt(z++)] << 12 |
      A[string.charCodeAt(z++)] << 6 | A[string.charCodeAt(z++)];
    a[y++] = b >> 16, a[y++] = b >> 8, a[y++] = b;
  }
  return a;
};
export const b_s64_1 = (binary: Uint8Array) => {
  let a = "", z = 0;
  while (z < binary.length) a += String.fromCharCode(binary[z++]);
  return btoa(a).replaceAll("+", "-").replaceAll("/", "_").replace(/=?=$/, "");
};
export const s64_b_1 = (string: string) => {
  const a = atob(string.replaceAll("-", "+").replaceAll("_", "/"));
  const b = new Uint8Array(a.length);
  for (let z = 0; z < a.length; ++z) b[z] = a.charCodeAt(z);
  return b;
};
export const HEX = Array<string>(256);
for (let z = 0; z < 256; ++z) HEX[z] = z.toString(16).padStart(2, "0");
export const b_s16 = (binary: Uint8Array) => {
  let a = "", z = 0;
  while (z < binary.length) a += HEX[binary[z++]];
  return a;
};
