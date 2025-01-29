import { sha512 } from "./sha2.ts";

type Point = [X: bigint, Y: bigint, Z: bigint, T: bigint];
const P = (1n << 255n) - 19n,
  N = 1n << 252n | 0x14def9dea2f79cd65812631a5cf5d3edn,
  D = 0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3n,
  R = 0x2b8324804fc1df0b2b4d00993dfbd7a72f431806ad2fe478c4ee1b274a0ea0b0n,
  X = 0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51an,
  Y = 0x6666666666666666666666666666666666666666666666666666666666666658n,
  G = Array<Point>(4224);
const p = (base: bigint) => (base %= P) < 0n ? base + P : base;
const s = (base: bigint, power: number, multiplier = base) => {
  do base = base * base % P; while (--power);
  return base * multiplier % P;
};
const b_i = (binary: Uint8Array) => {
  const a = new DataView(binary.buffer, binary.byteOffset);
  return a.getBigUint64(0, true) | a.getBigUint64(8, true) << 64n |
    a.getBigUint64(16, true) << 128n | a.getBigUint64(24, true) << 192n;
};
const i_b = (big: bigint) => {
  const a = new Uint8Array(32), b = new DataView(a.buffer);
  b.setBigUint64(24, big >> 192n, true), b.setBigUint64(16, big >> 128n, true);
  return b.setBigUint64(8, big >> 64n, true), b.setBigUint64(0, big, true), a;
};
const int = (binary: Uint8Array) => {
  const a = new DataView(sha512(binary).buffer);
  return (a.getBigUint64(0, true) | a.getBigUint64(8, true) << 64n |
    a.getBigUint64(16, true) << 128n | a.getBigUint64(24, true) << 192n |
    a.getBigUint64(32, true) << 256n | a.getBigUint64(40, true) << 320n |
    a.getBigUint64(48, true) << 384n | a.getBigUint64(56, true) << 448n) % N;
};
const b_e = (k: Uint8Array) => (k[0] &= 248, k[31] = k[31] & 127 | 64, b_i(k));
const b_p = (binary: Uint8Array) => {
  const a = binary[31] >> 7, b = b_i(binary) & ~(1n << 255n), c = b * b % P;
  const d = p(~-c), e = c * D + 1n, f = e ** 3n % P, g = e * f * f % P * d % P;
  const h = s(g ** 31n % P, 5), i = s(s(s(h, 10), 20), 40);
  let j = s(s(s(s(i, 80), 80, i), 10, h), 2, d * f * g), k = e * j * j % P;
  if (k === P - d) j = j * R % P;
  else if (k !== d) throw 0;
  if (a && !j) throw 0;
  return [k = Number(j & 1n) ^ a ? P - j : j, b, 1n, k * b % P] satisfies Point;
};
const add = (one: Point, two: Point) => {
  const a = one[0] * two[0] % P + one[1] * two[1] % P, b = one[2] * two[2] % P;
  const c = one[3] * D * two[3] % P, d = b + c, e = b - c;
  const f = (one[0] + one[1]) * (two[0] + two[1]) % P - a;
  one[0] = p(e * f), one[1] = p(a * d), one[2] = p(d * e), one[3] = p(a * f);
};
const double = (one: Point) => {
  const a = one[0] * one[0] % P, b = P - a, c = one[1] * one[1] % P;
  const d = b + c, e = b - c, f = d - (one[2] * one[2] % P << 1n) % P;
  const g = (one[0] + one[1]) * (one[0] + one[1]) % P - a - c;
  one[0] = p(f * g), one[1] = p(d * e), one[2] = p(d * f), one[3] = p(e * g);
};
for (let z = 0, a: Point = [X, Y, 1n, X * Y % P], b: Point, y; z < 4224;) {
  G[z++] = b = [...a], y = 127;
  do add(G[z++] = b = [...b], a); while (--y);
  double(a = [...b]);
}
const wnaf = (scalar: bigint) => {
  const a: Point = [0n, 1n, 1n, 0n], b: Point = [X, Y, 1n, X * Y % P];
  let c: Point, d, e, z = 0;
  do d = Number(scalar & 255n),
    scalar >>= 8n,
    d > 128 && (d -= 256, ++scalar),
    e = G[(z << 7) + Math.abs(d) - +!!d],
    c = [P - e[0], e[1], e[2], P - e[3]],
    d ? add(a, d < 0 ? c : e) : add(b, z & 1 ? c : e); while (++z < 33);
  return [a, b];
};
const k_b = (scalar: bigint) => {
  const a = wnaf(scalar)[0];
  let b = 0n, c = p(a[2]), d = P, e = 1n, f = 0n, g, h, i;
  while (g = c) c = d % g, d /= g, h = b - d * e, b = e, e = h, f *= ~d, d = g;
  return b = p(b), i = i_b(p(a[1] * b)), a[0] * b % P & 1n && (i[31] |= 128), i;
};
export const generate = (secret_key: Uint8Array) =>
  k_b(b_e(sha512(secret_key.subarray(0, 32))));
export const sign = (secret_key: Uint8Array, message: Uint8Array) => {
  const a = sha512(secret_key.subarray(0, 32));
  const b = new Uint8Array(message.length + 64);
  b.set(a.subarray(32)), b.set(message, 32);
  const c = int(b.subarray(0, -32)), d = b_e(a);
  a.set(k_b(c)), b.set(a), b.set(k_b(d), 32), b.set(message, 64);
  return a.set(i_b((c + d * int(b) % N) % N), 32), a;
};
export const verify = (
  public_key: Uint8Array,
  message: Uint8Array,
  signature: Uint8Array,
) => {
  try {
    if (signature.length !== 64) return false;
    const a = b_i(signature.subarray(32));
    if (a >= N) return false;
    const b: Point = [0n, 1n, 1n, 0n], c = new Uint8Array(message.length + 64);
    c.set(signature), c.set(public_key, 32), c.set(message, 64);
    let d = int(c), e = b_p(public_key);
    do d & 1n && add(b, e), double(e); while (d >>= 1n);
    add(b, b_p(signature)), e = wnaf(a)[0];
    return !(p(b[0] * e[2]) ^ p(b[2] * e[0]) | p(b[1] * e[2]) ^ p(b[2] * e[1]));
  } catch {
    return false;
  }
};
