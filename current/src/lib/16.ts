/**
 * @module
 *
 * Base16 binary-to-text encoding.
 *
 * @see {@link https://w.wiki/4NDr | Binary-to-text encoding}
 * @see {@link https://w.wiki/CmTQ | Base16}
 * @see {@link https://www.rfc-editor.org/rfc/rfc4648#section-8 | RFC4648}
 */

const B16_BYTES = new Uint8Array(256);
for (let z = 0; z < 16; ++z) B16_BYTES[z.toString(16).charCodeAt(0)] = z;
const B16_CHARS = Array<string>(16);
for (let z = 0; z < 256; ++z) B16_CHARS[z] = z.toString(16).padStart(2, "0");

/**
 * Encode binary to base16.
 *
 * @param binary Binary to encode.
 * @returns Encoded base16 string with length `binary.length * 2`.
 *
 * Using an array of each byte's corresponding base16 string is 2.5x-4.5x faster
 * than `.toString(16).padStart(2, "0")`.
 */
export const b_s16 = (binary: Uint8Array): string => {
  let out = "", z = 0;
  while (z < binary.length) out += B16_CHARS[binary[z++]];
  return out;
};

/**
 * Decode binary from base16.
 *
 * @param string Base16 string to decode (case-sensitive).
 * @returns Decoded binary with length `string.length / 2`.
 *
 * Using an array of each base16 character's corresponding nibble (half-byte of
 * 4 bits) is 2.5x-4.5x faster than `parseInt(character1 + character2, 16)`.
 *
 * Each byte is "big-endian" with regard to its characters, so you decode
 * `c3` with the `c` (12) shifted 4 places right, ORed with the `3` to get
 * `192 | 3` (192).
 */
export const s16_b = (string: string): Uint8Array => {
  const out = new Uint8Array(string.length >> 1);
  for (let z = 0; z < out.length; ++z) {
    out[z] = B16_BYTES[string.charCodeAt(z << 1)] << 4 |
      B16_BYTES[string.charCodeAt((z << 1) + 1)];
  }
  return out;
};
