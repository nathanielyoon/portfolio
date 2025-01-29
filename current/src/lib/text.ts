/**
 * @module
 *
 * Text encoding/decoding.
 *
 * @see {@link https://w.wiki/3noC | UTF-8}
 * @see {@linkcode https://dev.mozilla.org/API/TextEncoder | TextEncoder}
 * @see {@linkcode https://dev.mozilla.org/API/TextDecoder | TextDecoder}
 */

/**
 * Encode text to binary.
 *
 * @param string Text to encode.
 * @returns Encoded binary.
 *
 * The order of "encode" and "decode" is reversed from the other binary/text
 * modules. There, binary is encoded into and decoded from a string, while here
 * strings are encoded into and decoded from binary.
 */
export const s_b: (string: string) => Uint8Array = /* @__PURE__ */ TextEncoder
  .prototype.encode.bind(/* @__PURE__ */ new TextEncoder());

/**
 * Decode text from binary.
 *
 * @param Binary to decode.
 * @returns Decoded text.
 *
 * You don't need to instantiate a unique TextDecoder object since you don't use
 * (non-UTF8) labels or options.
 */
export const b_s: (binary: Uint8Array) => string = /* @__PURE__ */ TextDecoder
  .prototype.decode.bind(/* @__PURE__ */ new TextDecoder());
