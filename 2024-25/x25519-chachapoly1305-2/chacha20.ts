// rfc8439 2.1-2.4, w.wiki/8NMF
const A = 16, B = 12, C = 20, D = 8, E = 24, F = 7, G = 25;
export default class ChaCha {
  private a = new Uint32Array(16);
  private b = new ArrayBuffer(64);
  constructor(key: ArrayBuffer, iv: Uint8Array | Uint32Array, from = 0) {
    this.a[0] = 0x61707865, this.a[1] = 0x3320646e, this.a[2] = 0x79622d32;
    this.a[3] = 0x6b206574, this.a.set(new Uint32Array(key), 4);
    if ((iv = new Uint32Array(iv.buffer)).length === 4) this.a.set(iv, 12);
    else this.a[12] = from, this.a.set(iv, 13);
  }
  private block() {
    const a = new Uint32Array(this.b);
    let b = this.a[0], c = this.a[1], d = this.a[2], e = this.a[3];
    let f = this.a[4], g = this.a[5], h = this.a[6], i = this.a[7];
    let j = this.a[8], k = this.a[9], l = this.a[10], m = this.a[11];
    let n = this.a[12], o = this.a[13], p = this.a[14], q = this.a[15];
    for (let z = 0; z < 10; ++z) {
      n = (n ^= b += f) << A | n >>> A, f = (f ^= j += n) << B | f >>> C;
      n = (n ^= b += f) << D | n >>> E, f = (f ^= j += n) << F | f >>> G;
      o = (o ^= c += g) << A | o >>> A, g = (g ^= k += o) << B | g >>> C;
      o = (o ^= c += g) << D | o >>> E, g = (g ^= k += o) << F | g >>> G;
      p = (p ^= d += h) << A | p >>> A, h = (h ^= l += p) << B | h >>> C;
      p = (p ^= d += h) << D | p >>> E, h = (h ^= l += p) << F | h >>> G;
      q = (q ^= e += i) << A | q >>> A, i = (i ^= m += q) << B | i >>> C;
      q = (q ^= e += i) << D | q >>> E, i = (i ^= m += q) << F | i >>> G;
      q = (q ^= b += g) << A | q >>> A, g = (g ^= l += q) << B | g >>> C;
      q = (q ^= b += g) << D | q >>> E, g = (g ^= l += q) << F | g >>> G;
      n = (n ^= c += h) << A | n >>> A, h = (h ^= m += n) << B | h >>> C;
      n = (n ^= c += h) << D | n >>> E, h = (h ^= m += n) << F | h >>> G;
      o = (o ^= d += i) << A | o >>> A, i = (i ^= j += o) << B | i >>> C;
      o = (o ^= d += i) << D | o >>> E, i = (i ^= j += o) << F | i >>> G;
      p = (p ^= e += f) << A | p >>> A, f = (f ^= k += p) << B | f >>> C;
      p = (p ^= e += f) << D | p >>> E, f = (f ^= k += p) << F | f >>> G;
    }
    a[0] = b, a[1] = c, a[2] = d, a[3] = e, a[4] = f, a[5] = g, a[6] = h;
    a[7] = i, a[8] = j, a[9] = k, a[10] = l, a[11] = m, a[12] = n, a[13] = o;
    return a[14] = p, a[15] = q, a;
  }
  key() {
    return new Uint32Array(this.block().copyWithin(4, 12).subarray(0, 8));
  }
  stream() {
    const a = this.block();
    a[0] += this.a[0], a[1] += this.a[1], a[2] += this.a[2], a[3] += this.a[3];
    a[4] += this.a[4], a[5] += this.a[5], a[6] += this.a[6], a[7] += this.a[7];
    a[8] += this.a[8], a[9] += this.a[9], a[10] += this.a[10];
    a[11] += this.a[11], a[12] += this.a[12]++, a[13] += this.a[13];
    return a[14] += this.a[14], a[15] += this.a[15], new Uint8Array(this.b);
  }
  xor(data: Uint8Array) {
    let Z = data.length, Y = Z - Z % 64, x = 0, w, c = new Uint8Array(data), d;
    while (x < Y) for (w = 0, d = this.stream(); w < 64;) c[x++] ^= d[w++];
    if (Y < Z) for (w = 0, d = this.stream(); x < Z;) c[x++] ^= d[w++];
    return c;
  }
}
