const T = /* @__PURE__ */ (() => {
  const a = 0xedb88320, b = Array<number>(256);
  for (let z = 0, c; z < 256; ++z) {
    c = z;
    c = c & 1 ? a ^ c >>> 1 : c >>> 1, c = c & 1 ? a ^ c >>> 1 : c >>> 1;
    c = c & 1 ? a ^ c >>> 1 : c >>> 1, c = c & 1 ? a ^ c >>> 1 : c >>> 1;
    c = c & 1 ? a ^ c >>> 1 : c >>> 1, c = c & 1 ? a ^ c >>> 1 : c >>> 1;
    c = c & 1 ? a ^ c >>> 1 : c >>> 1, c = c & 1 ? a ^ c >>> 1 : c >>> 1;
    b[z] = c;
  }
  return b;
})();
/**
 * 32-bit cyclic redundancy check.
 *
 * @param id 32-bit number to hash.
 * @param base Initial value.
 * @returns Unique 32-bit number.
 *
 * ```ts
 * const a = 12345, b = 67890;
 * crc(a) !== crc(b); // true
 * ```
 */
export const crc = (id: number, base = -1) => { // w.wiki/3rhy
  base = base >> 8 ^ T[(base ^ id) & 0xff];
  base = base >> 8 ^ T[(base ^ id >> 8) & 0xff];
  base = base >> 8 ^ T[(base ^ id >> 16) & 0xff];
  base = base >> 8 ^ T[(base ^ id >> 24) & 0xff];
  return base >>> 0;
};

import.meta.vitest?.describe.concurrent("crc", (t) => {
  t("unique, probably", ({ expect }) => {
    for (let z = 0; z < 0x100; ++z) {
      const a = Math.random() * 0x100000000 >>> 0;
      expect(crc(a)).not.toBe(crc(a ^ 1));
    }
  });
  0 && t("injective", ({ expect }) => { // ✓ injective 83387ms
    const a = new Uint8Array(0x100000000);
    for (let z = 0; z < 0x100000000; ++z) a[crc(z)] = 1;
    expect(a.every((A) => A === 1)).toBe(true);
  });
});
