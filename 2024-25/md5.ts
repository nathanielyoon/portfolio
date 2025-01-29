const A = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]);
const B = new Uint32Array(64);
for (let z = 0; z < 64; ++z) B[z] = 0x100000000 * Math.abs(Math.sin(z + 1));
const block = (from: DataView, at: number, to: Uint32Array) => {
  const a = from.getUint32(at, true), b = from.getUint32(++at, true);
  const c = from.getUint32(++at, true), d = from.getUint32(++at, true);
  const e = from.getUint32(++at, true), f = from.getUint32(++at, true);
  const g = from.getUint32(++at, true), h = from.getUint32(++at, true);
  const i = from.getUint32(++at, true), j = from.getUint32(++at, true);
  const k = from.getUint32(++at, true), l = from.getUint32(++at, true);
  const m = from.getUint32(++at, true), n = from.getUint32(++at, true);
  const o = from.getUint32(++at, true), p = from.getUint32(++at, true);
  let q = to[0], r = to[1], s = to[2], t = to[3], u: number;
  const v = q, w = r, x = s, y = t;
  u = q + (r & s | ~r & t) + a + B[0] | 0, q = r + (u << 7 | u >>> 25) | 0;
  u = t + (q & r | ~q & s) + b + B[1] | 0, t = q + (u << 12 | u >>> 20) | 0;
  u = s + (t & q | ~t & r) + c + B[2] | 0, s = t + (u << 17 | u >>> 15) | 0;
  u = r + (s & t | ~s & q) + d + B[3] | 0, r = s + (u << 22 | u >>> 10) | 0;
  u = q + (r & s | ~r & t) + e + B[4] | 0, q = r + (u << 7 | u >>> 25) | 0;
  u = t + (q & r | ~q & s) + f + B[5] | 0, t = q + (u << 12 | u >>> 20) | 0;
  u = s + (t & q | ~t & r) + g + B[6] | 0, s = t + (u << 17 | u >>> 15) | 0;
  u = r + (s & t | ~s & q) + h + B[7] | 0, r = s + (u << 22 | u >>> 10) | 0;
  u = q + (r & s | ~r & t) + i + B[8] | 0, q = r + (u << 7 | u >>> 25) | 0;
  u = t + (q & r | ~q & s) + j + B[9] | 0, t = q + (u << 12 | u >>> 20) | 0;
  u = s + (t & q | ~t & r) + k + B[10] | 0, s = t + (u << 17 | u >>> 15) | 0;
  u = r + (s & t | ~s & q) + l + B[11] | 0, r = s + (u << 22 | u >>> 10) | 0;
  u = q + (r & s | ~r & t) + m + B[12] | 0, q = r + (u << 7 | u >>> 25) | 0;
  u = t + (q & r | ~q & s) + n + B[13] | 0, t = q + (u << 12 | u >>> 20) | 0;
  u = s + (t & q | ~t & r) + o + B[14] | 0, s = t + (u << 17 | u >>> 15) | 0;
  u = r + (s & t | ~s & q) + p + B[15] | 0, r = s + (u << 22 | u >>> 10) | 0;
  u = q + (r & t | s & ~t) + b + B[16] | 0, q = r + (u << 5 | u >>> 27) | 0;
  u = t + (q & s | r & ~s) + g + B[17] | 0, t = q + (u << 9 | u >>> 23) | 0;
  u = s + (t & r | q & ~r) + l + B[18] | 0, s = t + (u << 14 | u >>> 18) | 0;
  u = r + (s & q | t & ~q) + a + B[19] | 0, r = s + (u << 20 | u >>> 12) | 0;
  u = q + (r & t | s & ~t) + f + B[20] | 0, q = r + (u << 5 | u >>> 27) | 0;
  u = t + (q & s | r & ~s) + k + B[21] | 0, t = q + (u << 9 | u >>> 23) | 0;
  u = s + (t & r | q & ~r) + p + B[22] | 0, s = t + (u << 14 | u >>> 18) | 0;
  u = r + (s & q | t & ~q) + e + B[23] | 0, r = s + (u << 20 | u >>> 12) | 0;
  u = q + (r & t | s & ~t) + j + B[24] | 0, q = r + (u << 5 | u >>> 27) | 0;
  u = t + (q & s | r & ~s) + o + B[25] | 0, t = q + (u << 9 | u >>> 23) | 0;
  u = s + (t & r | q & ~r) + d + B[26] | 0, s = t + (u << 14 | u >>> 18) | 0;
  u = r + (s & q | t & ~q) + i + B[27] | 0, r = s + (u << 20 | u >>> 12) | 0;
  u = q + (r & t | s & ~t) + n + B[28] | 0, q = r + (u << 5 | u >>> 27) | 0;
  u = t + (q & s | r & ~s) + c + B[29] | 0, t = q + (u << 9 | u >>> 23) | 0;
  u = s + (t & r | q & ~r) + h + B[30] | 0, s = t + (u << 14 | u >>> 18) | 0;
  u = r + (s & q | t & ~q) + m + B[31] | 0, r = s + (u << 20 | u >>> 12) | 0;
  u = q + (r ^ s ^ t) + f + B[32] | 0, q = r + (u << 4 | u >>> 28) | 0;
  u = t + (q ^ r ^ s) + i + B[33] | 0, t = q + (u << 11 | u >>> 21) | 0;
  u = s + (t ^ q ^ r) + l + B[34] | 0, s = t + (u << 16 | u >>> 16) | 0;
  u = r + (s ^ t ^ q) + o + B[35] | 0, r = s + (u << 23 | u >>> 9) | 0;
  u = q + (r ^ s ^ t) + b + B[36] | 0, q = r + (u << 4 | u >>> 28) | 0;
  u = t + (q ^ r ^ s) + e + B[37] | 0, t = q + (u << 11 | u >>> 21) | 0;
  u = s + (t ^ q ^ r) + h + B[38] | 0, s = t + (u << 16 | u >>> 16) | 0;
  u = r + (s ^ t ^ q) + k + B[39] | 0, r = s + (u << 23 | u >>> 9) | 0;
  u = q + (r ^ s ^ t) + n + B[40] | 0, q = r + (u << 4 | u >>> 28) | 0;
  u = t + (q ^ r ^ s) + a + B[41] | 0, t = q + (u << 11 | u >>> 21) | 0;
  u = s + (t ^ q ^ r) + d + B[42] | 0, s = t + (u << 16 | u >>> 16) | 0;
  u = r + (s ^ t ^ q) + g + B[43] | 0, r = s + (u << 23 | u >>> 9) | 0;
  u = q + (r ^ s ^ t) + j + B[44] | 0, q = r + (u << 4 | u >>> 28) | 0;
  u = t + (q ^ r ^ s) + m + B[45] | 0, t = q + (u << 11 | u >>> 21) | 0;
  u = s + (t ^ q ^ r) + p + B[46] | 0, s = t + (u << 16 | u >>> 16) | 0;
  u = r + (s ^ t ^ q) + c + B[47] | 0, r = s + (u << 23 | u >>> 9) | 0;
  u = q + (s ^ (r | ~t)) + a + B[48] | 0, q = r + (u << 6 | u >>> 26) | 0;
  u = t + (r ^ (q | ~s)) + h + B[49] | 0, t = q + (u << 10 | u >>> 22) | 0;
  u = s + (q ^ (t | ~r)) + o + B[50] | 0, s = t + (u << 15 | u >>> 17) | 0;
  u = r + (t ^ (s | ~q)) + f + B[51] | 0, r = s + (u << 21 | u >>> 11) | 0;
  u = q + (s ^ (r | ~t)) + m + B[52] | 0, q = r + (u << 6 | u >>> 26) | 0;
  u = t + (r ^ (q | ~s)) + d + B[53] | 0, t = q + (u << 10 | u >>> 22) | 0;
  u = s + (q ^ (t | ~r)) + k + B[54] | 0, s = t + (u << 15 | u >>> 17) | 0;
  u = r + (t ^ (s | ~q)) + b + B[55] | 0, r = s + (u << 21 | u >>> 11) | 0;
  u = q + (s ^ (r | ~t)) + i + B[56] | 0, q = r + (u << 6 | u >>> 26) | 0;
  u = t + (r ^ (q | ~s)) + p + B[57] | 0, t = q + (u << 10 | u >>> 22) | 0;
  u = s + (q ^ (t | ~r)) + g + B[58] | 0, s = t + (u << 15 | u >>> 17) | 0;
  u = r + (t ^ (s | ~q)) + n + B[59] | 0, r = s + (u << 21 | u >>> 11) | 0;
  u = q + (s ^ (r | ~t)) + e + B[60] | 0, q = r + (u << 6 | u >>> 26) | 0;
  u = t + (r ^ (q | ~s)) + l + B[61] | 0, t = q + (u << 10 | u >>> 22) | 0;
  u = s + (q ^ (t | ~r)) + c + B[62] | 0, s = t + (u << 15 | u >>> 17) | 0;
  u = r + (t ^ (s | ~q)) + j + B[63] | 0, r = s + (u << 21 | u >>> 11) | 0;
  to[0] = q + v | 0, to[1] = r + w | 0, to[2] = s + x | 0, to[3] = t + y | 0;
};
const md5 = (data: Uint8Array) => {
  const Z = data.length, a = new DataView(data.buffer), b = new Uint32Array(A);
  let z = 0, y = 0;
  while (z < Z) block(a, z, b), z += 64;
  const Y = Z - z, c = new Uint32Array(16), d = new DataView(c.buffer);
  while (y < Y) c[y >>> 2] |= data[z] << ((y & 3) << 3), ++z, ++y;
  c[y >>> 2] |= 0x80 << ((y & 3) << 3);
  if (y > 55) block(d, 0, b), c.fill(0);
  d.setBigUint64(56, BigInt(Z) * 8n, true), block(d, 0, b);
  return b;
};
