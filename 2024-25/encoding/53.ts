export const base53 = /^[A-Z_]*$/i;
const ALPHABET = "_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const CODES = new Uint8Array(256);
for (let z = 0; z < 53; ++z) CODES[ALPHABET.charCodeAt(z)] = z;
export const a_s53 = (bytes: Uint8Array) => {
  let string = "", z = 0;
  while (z < bytes.length) {
    const number = bytes[z++] + (bytes[z++] << 8) + (bytes[z++] << 16) +
      (bytes[z++] << 24 >>> 0) + (bytes[z++] ?? 0) * 0x100000000;
    string += ALPHABET[number % 53] +
      ALPHABET[number / 53 % 53 | 0] +
      ALPHABET[number / 2809 % 53 | 0] +
      ALPHABET[number / 148877 % 53 | 0] +
      ALPHABET[number / 7890481 % 53 | 0] +
      ALPHABET[number / 418195493 % 53 | 0] +
      ALPHABET[number / 22164361129 % 53 | 0];
  }
  return string.slice(0, bytes.length / 5 * 7 + .9 | 0);
};
export const s53_a = (string: string) => {
  const bytes = new Uint8Array(string.length / 7 * 5);
  let z = 0, y = 0;
  while (z < string.length) {
    const number = bytes[y++] = CODES[string.charCodeAt(z++)] +
      CODES[string.charCodeAt(z++) || 0] * 53 +
      CODES[string.charCodeAt(z++) || 0] * 2809 +
      CODES[string.charCodeAt(z++) || 0] * 148877 +
      CODES[string.charCodeAt(z++) || 0] * 7890481 +
      CODES[string.charCodeAt(z++) || 0] * 418195493 +
      CODES[string.charCodeAt(z++) || 0] * 22164361129;
    bytes[y++] = number >> 8, bytes[y++] = number >> 16;
    bytes[y++] = number >> 24, bytes[y++] = number / 0x100000000;
  }
  return bytes;
};
