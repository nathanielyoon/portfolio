const p = 2n ** 255n - 19n,
  A = 121665n,
  F = ~(1n << 255n),
  m = (a: bigint, b = a) => a * b % p,
  v = (a: bigint, b: bigint, c: bigint) => -a & (b ^ c),
  q = (a: bigint, b: bigint) => {
    do a = m(a); while (--b);
    return a;
  };
export default (scalar: bigint, point: bigint) => {
  let a = scalar & -8n & F | 1n << 254n, b = point & F;
  let c = 1n, d = 0n, e = b, f = 1n, g = 0n, h, i, z = 254n;
  do {
    c ^= h = v(i = g ^ (g = a >> z & 1n), c, e), d ^= i = v(i, d, f), e ^= h;
    f = m(b, m((i = m(e - (f ^= i), h = c + d)) - (e = m(e + f, d = c - d))));
    e = m(i + e), c = m(i = m(h), d = m(d)), d = m(d = i - d, i + m(d, A));
  } while (z--);
  c ^= v(g, c, e), d ^= v(g, d, f), f = m(d, m(d)), e = q(m(q(f, 2n), f), 1n);
  e = m(d, e), e = m(e, q(e, 5n)), g = m(e, q(e, 10n)), g = m(g, q(g, 20n));
  g = m(g, q(g, 40n)), g = q(m(e, q(m(g, q(m(g, q(g, 80n)), 80n)), 10n)), 2n);
  return (g = m(c, m(f, q(m(d, g), 3n)))) < 0n && (g += p), g & F;
};
