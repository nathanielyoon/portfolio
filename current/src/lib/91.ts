/**
 * @module
 *
 * Base91 binary-to-text encoding.
 *
 * @see {@link https://w.wiki/4NDr | Binary-to-text encoding}
 * @see {@link https://sourceforge.net/projects/base91 | BasE91}
 */

const B91_BYTES = new Uint8Array(127);
const B91_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,./:;<=>?@[]^_`{|}~"';
for (let z = 0; z < 91; ++z) B91_BYTES[B91_CHARS.charCodeAt(z)] = z;

/**
 * Encode binary to base91.
 *
 * @param binary Binary to encode.
 * @returns Encoded base91 string with length `<= binary.length * 16 / 13`.
 *
 * You can fit an extra bit if the bottom 13 ORed with a hypothetical `1 << 13`
 * is below 91 * 91 (8281). This saves space but makes it variable-length.
 */
export const b_s91 = (binary: Uint8Array): string => {
  let out = "", total = 0, bits = 0;
  for (let z = 0, d, e; z < binary.length; ++z) {
    total |= binary[z] << bits, bits += 8;
    if (bits > 13) {
      d = total & 0x1fff;
      if (d > 88) e = 13;
      else d |= total & 0x2000, e = 14;
      total >>= e, bits -= e, out += B91_CHARS[d % 91] + B91_CHARS[d / 91 | 0];
    }
  }
  return bits > 7 || total > 90
    ? out + B91_CHARS[total % 91] + B91_CHARS[total / 91 | 0]
    : bits
    ? out + B91_CHARS[total % 91]
    : out;
};

/**
 * Decodes binary from base91.
 *
 * @param string Base91 to decode.
 * @returns Decoded binary with length `>= string.length * 13 / 16`.
 *
 * You'll never need `length * 2` bytes but it's a bit faster than multiplying
 * by a smaller, more precise number.
 */
export const s91_b = (string: string): Uint8Array => {
  const length = string.length & ~1, out = new Uint8Array(length << 1);
  let total = 0, bits = 0, word, z = 0, y = 0;
  while (z < length) {
    word = B91_BYTES[string.charCodeAt(z++)] +
      B91_BYTES[string.charCodeAt(z++)] * 91;
    total |= word << bits, bits += (word & 0x1fff) > 88 ? 13 : 14;
    do out[y++] = total, total >>= 8, bits -= 8; while (bits > 7);
  }
  if (string.length > length) {
    out[y++] = total | B91_BYTES[string.charCodeAt(length)] << bits;
  }
  return new Uint8Array(out.subarray(0, y));
};
