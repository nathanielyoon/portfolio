// eprint.iacr.org/2014/386
// gitlab.com/fwojcik/smhasher3/-/blob/main/hashes/chaskey.cpp
// mouha.be/wp-content/uploads/chaskey-speed.c
export const seed = (high: number, low: number, buffer?: Uint32Array) => {
  let a = low ^ 0xe5d2aff1, b = high ^ 0x5c0e8048, c = low ^ 0xc35ad9d8;
  let d = high ^ 0xfbdf7e14, z = 6;
  do a += b,
    b = b << 5 | b >>> 27,
    b ^= a,
    a = a << 16 | a >>> 16,
    c += d,
    d = d << 8 | d >>> 24,
    d ^= c,
    a += d,
    d = d << 13 | d >>> 19,
    d ^= a,
    c += b,
    b = b << 7 | b >>> 25,
    b ^= c,
    c = c << 16 | c >>> 16; while (--z);
  const e = buffer ?? new Uint32Array(12);
  e[0] = a, e[1] = b, e[2] = c, e[3] = d, e[4] = a << 1 ^ +(d >>> 31 && 0x87);
  e[5] = b << 1 | a >>> 31, e[6] = c << 1 | b >>> 31, e[7] = d << 1 | c >>> 31;
  e[8] = e[4] << 1 ^ +(e[7] >>> 31 && 0x87), e[9] = e[5] << 1 | e[4] >>> 31;
  e[10] = e[6] << 1 | e[5] >>> 31, e[11] = e[7] << 1 | e[6] >>> 31;
  return e;
};
const chaskey =
  (rounds: number, tag_length: number) =>
  (key: Uint32Array, data: Uint8Array) => {
    let a = key[0], b = key[1], c = key[2], d = key[3];
    const e = data.length, f = e - 1 >>> 4 << 4, g = new DataView(data.buffer);
    for (let z = 0, y; z < f; z += 4) {
      a ^= g.getUint32(z, true), b ^= g.getUint32(z += 4, true);
      c ^= g.getUint32(z += 4, true), d ^= g.getUint32(z += 4, true), y = 0;
      do a += b,
        b = b << 5 | b >>> 27,
        b ^= a,
        a = a << 16 | a >>> 16,
        c += d,
        d = d << 8 | d >>> 24,
        d ^= c,
        a += d,
        d = d << 13 | d >>> 19,
        d ^= a,
        c += b,
        b = b << 7 | b >>> 25,
        b ^= c,
        c = c << 16 | c >>> 16; while (++y < rounds);
    }
    const h = e & 0xf, i = new Uint8Array(16), j = new DataView(i.buffer);
    const k = e && !h
      ? (i.set(data.subarray(f, f + 16)), 4)
      : (i.set(data.subarray(f, f + h)), i[h] = 1, 8);
    a ^= j.getUint32(0, true), b ^= j.getUint32(4, true);
    c ^= j.getUint32(8, true), d ^= j.getUint32(12, true);
    a ^= key[k], b ^= key[k + 1], c ^= key[k + 2], d ^= key[k + 3];
    let y = rounds;
    do a += b,
      b = b << 5 | b >>> 27,
      b ^= a,
      a = a << 16 | a >>> 16,
      c += d,
      d = d << 8 | d >>> 24,
      d ^= c,
      a += d,
      d = d << 13 | d >>> 19,
      d ^= a,
      c += b,
      b = b << 7 | b >>> 25,
      b ^= c,
      c = c << 16 | c >>> 16; while (--y);
    switch (tag_length) {
      case 16:
        j.setUint32(12, d ^ key[k + 3], true);
        j.setUint32(8, c ^ key[k + 2], true);
      case 8:
        j.setUint32(4, b ^ key[k + 1], true);
      case 4:
        j.setUint32(0, a ^ key[k], true);
    }
    return new Uint8Array(i.subarray(0, tag_length));
  };
export const chaskey8 = /* @__PURE__ */ chaskey(8, 16);
