export const halfsiphash = (
  cROUNDS: number,
  dROUNDS: number,
  data: Uint8Array,
  seed_high: number,
  seed_low: number,
) => {
  let a = seed_low, b = seed_high, c = 0x6c796765 ^ a, d = 0x74656462 ^ b;
  const Z = data.length, Y = Z - Z % 4;
  const e = new DataView(data.buffer);
  for (let z = 0, y, g; z < Y; z += 4) {
    for (y = 0, d ^= g = e.getUint32(z, true); y < cROUNDS; ++y) {
      a += b, b = b << 5 | b >>> 27, b ^= a, a = a << 16 | a >>> 16;
      c += d, d = d << 8 | d >>> 24, d ^= c;
      a += d, d = d << 7 | d >>> 25, d ^= a;
      c += b, b = b << 13 | b >>> 19, b ^= c, c = c << 16 | c >>> 16;
      a ^= g;
    }
  }
  let f = Z << 24;
  switch (Z & 3) {
    case 3:
      f |= data[Y + 2] << 16;
    case 2:
      f |= data[Y + 1] << 8;
    case 1:
      f |= data[Y];
  }
  d ^= f;
  for (let z = 0; z < cROUNDS; ++z) {
    a += b, b = b << 5 | b >>> 27, b ^= a, a = a << 16 | a >>> 16;
    c += d, d = d << 8 | d >>> 24, d ^= c;
    a += d, d = d << 7 | d >>> 25, d ^= a;
    c += b, b = b << 13 | b >>> 19, b ^= c, c = c << 16 | c >>> 16;
  }
  a ^= f, c ^= 0xff;
  for (let z = 0; z < dROUNDS; ++z) {
    a += b, b = b << 5 | b >>> 27, b ^= a, a = a << 16 | a >>> 16;
    c += d, d = d << 8 | d >>> 24, d ^= c;
    a += d, d = d << 7 | d >>> 25, d ^= a;
    c += b, b = b << 13 | b >>> 19, b ^= c, c = c << 16 | c >>> 16;
  }
  return b ^ d;
};
