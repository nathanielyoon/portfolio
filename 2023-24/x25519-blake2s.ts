const p = (1n << 255n) - 19n, // rfc7748 section 4.1
  a24 = 121665n, // constant from section 5
  F = ~(1n << 255n), // equivalent mask to bytes[-1] &= 127
  m = (a: bigint, b = a) => a * b % p, // multiplication mod p
  v = (a: bigint, b: bigint, c: bigint) => -a & (b ^ c), // part of conditional move
  q = (a: bigint, b: bigint) => { // a ** (2 ** b)
    do a = m(a); while (--b);
    return a;
  };
const ladder = (scalar: bigint, point: bigint) => { // rfc7748 section 5
  let a = scalar & -8n & F | 1n << 254n, b = point & F;
  let c = 1n, d = 0n, e = b, f = 1n, g = 0n, h, i, z = 254n;
  do { // hyperelliptic.org/EFD/g1p/auto-montgom-xz.html#ladder-mladd-1987-m
    c ^= h = v(i = g ^ (g = a >> z & 1n), c, e), d ^= i = v(i, d, f), e ^= h;
    f = m(b, m((i = m(e - (f ^= i), h = c + d)) - (e = m(e + f, d = c - d))));
    e = m(i + e), c = m(i = m(h), d = m(d)), d = m(d = i - d, i + m(d, a24));
  } while (z--);
  c ^= v(g, c, e), d ^= v(g, d, f), f = m(d, m(d)), e = q(m(q(f, 2n), f), 1n); // github.com/paulmillr/noble-curves
  e = m(d, e), e = m(e, q(e, 5n)), g = m(e, q(e, 10n)), g = m(g, q(g, 20n));
  g = m(g, q(g, 40n)), g = q(m(e, q(m(g, q(m(g, q(g, 80n)), 80n)), 10n)), 2n);
  return (g = m(c, m(f, q(m(d, g), 3n)))) < 0n && (g += p), g & F; // only place where mod (vs remainder) is needed
}; // dprint-ignore
const I = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]), // blake3 table 1
  r1 = (a: number) => a >>> 16 | a << 16, // w.wiki/8aGF
  r2 = (a: number) => a >>> 12 | a << 20,
  r3 = (a: number) => a >>> 8 | a << 24,
  r4 = (a: number) => a >>> 7 | a << 25;
const kdf = (a: Uint32Array, b: Uint32Array, c: number) => { // blake3 section 2.2
  let d = a[0], e = a[1], f = a[2], g = a[3], h = a[4], i = a[5], j = a[6];
  let k = a[7], l = I[0], m = I[1], n = I[2], o = I[3], p = 0, q = 0, r = 64;
  let s = c, z = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4];
  let b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], ba = b[10];
  let bb = b[11], bc = b[12], bd = b[13], be = b[14], bf = b[15];
  do {
    p = r1(p ^ (d += h + b0)), h = r2(h ^ (l += p)), p = r3(p ^ (d += h + b1));
    h = r4(h ^ (l += p)), q = r1(q ^ (e += i + b2)), i = r2(i ^ (m += q));
    q = r3(q ^ (e += i + b3)), i = r4(i ^ (m += q)), r = r1(r ^ (f += j + b4));
    j = r2(j ^ (n += r)), r = r3(r ^ (f += j + b5)), j = r4(j ^ (n += r));
    s = r1(s ^ (g += k + b6)), k = r2(k ^ (o += s)), s = r3(s ^ (g += k + b7));
    k = r4(k ^ (o += s)), s = r1(s ^ (d += i + b8)), i = r2(i ^ (n += s));
    s = r3(s ^ (d += i + b9)), i = r4(i ^ (n += s)), p = r1(p ^ (e += j + ba));
    j = r2(j ^ (o += p)), p = r3(p ^ (e += j + bb)), j = r4(j ^ (o += p));
    q = r1(q ^ (f += k + bc)), k = r2(k ^ (l += q)), q = r3(q ^ (f += k + bd));
    k = r4(k ^ (l += q)), r = r1(r ^ (g += h + be)), h = r2(h ^ (m += r));
    if (r = r3(r ^ (g += h + bf)), h = r4(h ^ (m += r)), ++z > 6) break; // last round doesn't permute
    c = d, d = f, f = g, g = n, n = p, p = d, m = o, o = i, i = c;
    c = e, e = j, j = h, h = k, k = q, q = r, r = s, s = l, l = c;
  } while (true);
  b[8] = l ^ (b[0] = d ^ l), b[9] = m ^ (b[1] = e ^ m);
  b[10] = n ^ (b[2] = f ^ n), b[11] = o ^ (b[3] = g ^ o);
  b[12] = p ^ (b[4] = h ^ p), b[13] = q ^ (b[5] = i ^ q);
  b[14] = r ^ (b[6] = j ^ r), b[15] = s ^ (b[7] = k ^ s);
};
const i_a = (a: bigint, b = 4) => { // the b parameter lets this function initialize a larger typed array to avoid copying values
  const c = new BigUint64Array(b), d = new Uint8Array(c.buffer);
  return c[0] = a, c[1] = a >> 64n, c[2] = a >> 128n, c[3] = a >> 192n, d;
};
const a_i = (a: Uint8Array) => {
  const b = new BigUint64Array(a.buffer);
  return b[0] | b[1] << 64n | b[2] << 128n | b[3] << 192n;
};
const C = new Uint32Array(16);
new TextEncoder().encodeInto(
  "tab-wiki ecdh 2023-12-20T01:05:11-05:00 blake3ish key derivation", // blake3 section 6.2
  new Uint8Array(C.buffer),
), kdf(I, C, 47); // blake3 table 3 (CHUNK_START | CHUNK_END | PARENT | ROOT | DERIVE_KEY_CONTEXT)
export const scalar = () => crypto.getRandomValues(new Uint8Array(32)), // for convenience
  point = (scalar: Uint8Array) => i_a(ladder(a_i(scalar), 9n)),
  secret = (scalar_1: Uint8Array, point_1: Uint8Array, point_2: Uint8Array) => {
    let a = i_a(ladder(a_i(scalar_1), a_i(point_2)), 8), b = 0, z = 0; // rfc7748 section 7
    do a[z + 32] = point_1[z] ^ point_2[z], b |= a[z]; while (++z < 32);
    if (b === 0) throw Error("Input order is too small"); // rfc7748 section 6.1
    return kdf(C, new Uint32Array(a.buffer), 79), a; //  blake3 table 3 (CHUNK_START | CHUNK_END | PARENT | ROOT | DERIVE_KEY_MATERIAL)
  };
