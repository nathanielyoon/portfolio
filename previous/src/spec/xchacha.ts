const A = 0x61707865, B = 0x3320646e, C = 0x79622d32, D = 0x6b206574;
export const chacha = (
  key: DataView,
  counter: number,
  iv0: number,
  iv1: number,
  iv2: number,
  to: Uint32Array,
) => {
  const a = key.getUint32(0, true), b = key.getUint32(4, true);
  const c = key.getUint32(8, true), d = key.getUint32(12, true);
  const e = key.getUint32(16, true), f = key.getUint32(20, true);
  const g = key.getUint32(24, true), h = key.getUint32(28, true);
  let i = A, j = B, k = C, l = D, m = a, n = b, o = c, p = d, q = e, r = f;
  let s = g, t = h, u = counter, v = iv0, w = iv1, x = iv2, z = 10;
  do u ^= i = i + m | 0,
    u = u << 16 | u >>> 16,
    m ^= q = q + u | 0,
    m = m << 12 | m >>> 20,
    u ^= i = i + m | 0,
    u = u << 8 | u >>> 24,
    m ^= q = q + u | 0,
    m = m << 7 | m >>> 25,
    v ^= j = j + n | 0,
    v = v << 16 | v >>> 16,
    n ^= r = r + v | 0,
    n = n << 12 | n >>> 20,
    v ^= j = j + n | 0,
    v = v << 8 | v >>> 24,
    n ^= r = r + v | 0,
    n = n << 7 | n >>> 25,
    w ^= k = k + o | 0,
    w = w << 16 | w >>> 16,
    o ^= s = s + w | 0,
    o = o << 12 | o >>> 20,
    w ^= k = k + o | 0,
    w = w << 8 | w >>> 24,
    o ^= s = s + w | 0,
    o = o << 7 | o >>> 25,
    x ^= l = l + p | 0,
    x = x << 16 | x >>> 16,
    p ^= t = t + x | 0,
    p = p << 12 | p >>> 20,
    x ^= l = l + p | 0,
    x = x << 8 | x >>> 24,
    p ^= t = t + x | 0,
    p = p << 7 | p >>> 25,
    x ^= i = i + n | 0,
    x = x << 16 | x >>> 16,
    n ^= s = s + x | 0,
    n = n << 12 | n >>> 20,
    x ^= i = i + n | 0,
    x = x << 8 | x >>> 24,
    n ^= s = s + x | 0,
    n = n << 7 | n >>> 25,
    u ^= j = j + o | 0,
    u = u << 16 | u >>> 16,
    o ^= t = t + u | 0,
    o = o << 12 | o >>> 20,
    u ^= j = j + o | 0,
    u = u << 8 | u >>> 24,
    o ^= t = t + u | 0,
    o = o << 7 | o >>> 25,
    v ^= k = k + p | 0,
    v = v << 16 | v >>> 16,
    p ^= q = q + v | 0,
    p = p << 12 | p >>> 20,
    v ^= k = k + p | 0,
    v = v << 8 | v >>> 24,
    p ^= q = q + v | 0,
    p = p << 7 | p >>> 25,
    w ^= l = l + m | 0,
    w = w << 16 | w >>> 16,
    m ^= r = r + w | 0,
    m = m << 12 | m >>> 20,
    w ^= l = l + m | 0,
    w = w << 8 | w >>> 24,
    m ^= r = r + w | 0,
    m = m << 7 | m >>> 25; while (--z);
  to[0] = A + i, to[1] = B + j, to[2] = C + k, to[3] = D + l, to[4] = a + m;
  to[5] = b + n, to[6] = c + o, to[7] = d + p, to[8] = e + q, to[9] = f + r;
  to[10] = g + s, to[11] = h + t, to[12] = counter + u, to[13] = iv0 + v;
  to[14] = iv1 + w, to[15] = iv2 + x;
};
export const hchacha = (use: Uint32Array, key: DataView, iv: DataView) => {
  const a = new DataView(new ArrayBuffer(32));
  const b = iv.getUint32(0, true), c = iv.getUint32(4, true);
  const d = iv.getUint32(8, true), e = iv.getUint32(12, true);
  chacha(key, b, c, d, e, use), a.setUint32(0, use[0] - A, true);
  a.setUint32(4, use[1] - B, true), a.setUint32(8, use[2] - C, true);
  a.setUint32(12, use[3] - D, true), a.setUint32(16, use[12] - b, true);
  a.setUint32(20, use[13] - c, true), a.setUint32(24, use[14] - d, true);
  return a.setUint32(28, use[15] - e, true), a;
};
