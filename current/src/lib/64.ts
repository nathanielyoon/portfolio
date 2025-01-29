/**
 * @module
 *
 * Base64url binary-to-text encoding.
 *
 * @see {@link https://w.wiki/4NDr | Binary-to-text encoding}
 * @see {@link https://w.wiki/CmTN | Base64}
 * @see {@link https://dev.mozilla.org/docs/Glossary/Base64 | Base64}
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648#section-8 | RFC4648}
 */

const B64_BYTES = new Uint8Array(123);
const B64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
for (let z = 0; z < 64; ++z) B64_BYTES[B64_CHARS.charCodeAt(z)] = z;

/**
 * Encode binary to base64url.
 *
 * @param binary Binary to encode.
 * @returns Encoded base64url string with length `⌈binary.length * 4 / 3⌉`.
 *
 * Calculating the 24-bit integer and indexing the base64url alphabet is faster
 * than `btoa(b).replaceAll("+", "-").replaceAll("/", "_")`. On short inputs
 * it's 1.4x faster, and the methods even out around 256 bytes, but when the
 * input length is a multiple of 3 it's at least 1.1x faster.
 *
 * The first 6-bit integer is from the top 6 bits so it doesn't need a mask of
 * `& 0b111111`.
 */
export const b_s64 = (binary: Uint8Array): string => {
  let out = "", z = 0;
  while (z < binary.length) {
    const integer = binary[z++] << 16 | binary[z++] << 8 | binary[z++];
    out += B64_CHARS[integer >> 18] + B64_CHARS[integer >> 12 & 63] +
      B64_CHARS[integer >> 6 & 63] + B64_CHARS[integer & 63];
  }
  return out.slice(0, Math.ceil(binary.length * 4 / 3));
};

/**
 * Decode binary from base64url.
 *
 * @param string Base64url to decode.
 * @returns Decoded binary with length `⌊string.length / 4 * 3⌋`.
 *
 * Using an array of each base64url character's corresponding 6-bit integer is
 * 1.2x-1.7x faster than `atob(a.replaceAll("-", "+").replaceAll("_", "/"))`.
 */
export const s64_b = (string: string): Uint8Array => {
  const out = new Uint8Array(string.length * 3 >> 2);
  let z = 0, y = 0;
  while (z < string.length) {
    const integer = B64_BYTES[string.charCodeAt(z++)] << 18 |
      B64_BYTES[string.charCodeAt(z++)] << 12 |
      B64_BYTES[string.charCodeAt(z++)] << 6 |
      B64_BYTES[string.charCodeAt(z++)];
    out[y++] = integer >> 16, out[y++] = integer >> 8, out[y++] = integer;
  }
  return out;
};
