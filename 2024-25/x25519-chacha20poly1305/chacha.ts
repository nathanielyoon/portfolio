const r = (a: number, b: number) => a << b | a >>> 32 - b;
const block = (a: Uint32Array) => {
  let b = a[16], c = a[17], d = a[18], e = a[19], f = a[20], g = a[21];
  let h = a[22], i = a[23], j = a[24], k = a[25], l = a[26], m = a[27];
  let n = a[28]++, o = a[29], p = a[30], q = a[31];
  for (let z = 0; z < 10; ++z) {
    n = r(n ^= b += f, 16), f = r(f ^= j += n, 12), n = r(n ^= b += f, 8);
    f = r(f ^= j += n, 7), o = r(o ^= c += g, 16), g = r(g ^= k += o, 12);
    o = r(o ^= c += g, 8), g = r(g ^= k += o, 7), p = r(p ^= d += h, 16);
    h = r(h ^= l += p, 12), p = r(p ^= d += h, 8), h = r(h ^= l += p, 7);
    q = r(q ^= e += i, 16), i = r(i ^= m += q, 12), q = r(q ^= e += i, 8);
    i = r(i ^= m += q, 7), q = r(q ^= b += g, 16), g = r(g ^= l += q, 12);
    q = r(q ^= b += g, 8), g = r(g ^= l += q, 7), n = r(n ^= c += h, 16);
    h = r(h ^= m += n, 12), n = r(n ^= c += h, 8), h = r(h ^= m += n, 7);
    o = r(o ^= d += i, 16), i = r(i ^= j += o, 12), o = r(o ^= d += i, 8);
    i = r(i ^= j += o, 7), p = r(p ^= e += f, 16), f = r(f ^= k += p, 12);
    p = r(p ^= e += f, 8), f = r(f ^= k += p, 7);
  }
  a[0] = b, a[1] = c, a[2] = d, a[3] = e, a[4] = f, a[5] = g, a[6] = h;
  a[7] = i, a[8] = j, a[9] = k, a[10] = l, a[11] = m, a[12] = n, a[13] = o;
  a[14] = p, a[15] = q;
};
const stream = (a: Uint32Array) => {
  block(a), a[0] += a[16], a[1] += a[17], a[2] += a[18], a[3] += a[19];
  a[4] += a[20], a[5] += a[21], a[6] += a[22], a[7] += a[23], a[8] += a[24];
  a[9] += a[25], a[10] += a[26], a[11] += a[27], a[12] += a[28], a[13] += a[29];
  return a[14] += a[30], a[15] += a[31], new Uint8Array(a.buffer);
};
export const state = (key: ArrayBuffer, iv: Uint8Array) => {
  let a = new Uint32Array(32), b = new Uint32Array(iv.buffer);
  a.set(new Uint32Array(key), 20), a.set(b.subarray(0, 4), 28);
  a[16] = 0x61707865, a[17] = 0x3320646e, a[18] = 0x79622d32;
  a[19] = 0x6b206574, block(a), a[28] = a[29] = 0, a.set(b.subarray(4, 6), 30);
  return a.copyWithin(20, 0, 4), stream(a.copyWithin(24, 12, 16)), a;
};
export default (state: Uint32Array, data: Uint8Array) => {
  let Z = data.length, Y = Z - Z % 64, z = 0, y, c = new Uint8Array(data), d;
  while (z < Y) for (y = 0, d = stream(state); y < 64; ++z, ++y) c[z] ^= d[y];
  if (Y < Z) for (y = 0, d = stream(state); z < Z; ++z, ++y) c[z] ^= d[y];
  return c;
};
