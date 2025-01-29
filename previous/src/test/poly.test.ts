import { assertEquals } from "@std/assert";
import { read, s16_b, slice, test } from "./test.ts";
import { poly } from "../spec/poly.ts";

test(poly.name, async () => {
  const a = slice(await read("aead/rfc8439.txt"), {
    key: [30458, 102],
    iv_1: [30927, 47],
    iv_2: [31000, 47],
    iv_3: [31073, 5],
    tag: [32622, 47],
  });
  assertEquals(
    poly(
      new DataView(s16_b(a.key.replace(/\s/g, "")).buffer),
      s16_b(a.iv_1 + a.iv_2 + a.iv_3),
    ),
    s16_b(a.tag),
    "2.5.2",
  );
});
test("self", async () => {
  const a = await read("poly/donna.c", 2198), b = Array<Uint8Array>(6);
  const c = /\{\s*((?:0x[\da-f]{2},?\s*)+)\s*\}/g;
  for (let z = 0; z < b.length; ++z) b[z] = s16_b(c.exec(a)![1]);
  assertEquals(poly(new DataView(b[0].buffer), b[1]), b[2], "nacl");
  assertEquals(poly(new DataView(b[3].buffer), b[4]), b[5], "wrap");
});
const M = 0x1fff;
const block = (
  base: Uint16Array,
  input: Uint8Array,
  to: Uint16Array,
  final: number,
  at: number,
) => {
  let a = input[at] | input[++at] << 8, b = input[++at] | input[++at] << 8;
  let c = input[++at] | input[++at] << 8, d = input[++at] | input[++at] << 8;
  const e = to[0] + (a & M), f = to[1] + ((a >> 13 | b << 3) & M);
  const g = to[2] + ((b >> 10 | c << 6) & M);
  const h = to[3] + ((c >> 7 | d << 9) & M);
  a = input[++at] | input[++at] << 8, b = input[++at] | input[++at] << 8;
  const i = to[4] + ((d >> 4 | a << 12) & M), j = to[5] + ((a >> 1) & M);
  const k = to[6] + ((a >> 14 | b << 2) & M);
  c = input[++at] | input[++at] << 8, d = input[++at] | input[++at] << 8;
  const l = to[7] + ((b >> 11 | c << 5) & M);
  const m = to[8] + ((c >> 8 | d << 8) & M), n = to[9] + (d >> 5 | final);
  const o = base[a = 0], p = base[1], q = base[2], r = base[3], s = base[4];
  const t = base[5], u = base[6], v = base[7], w = base[8], x = base[9];
  b = a + e * o + (f * x + g * w + h * v + i * u) * 5;
  a = b >>> 13;
  b = (b & M) + (j * t + k * s + l * r + m * q + n * p) * 5;
  c = b >>> 13;
  c += a + e * p + f * o + (g * x + h * w + i * v) * 5;
  a = c >>> 13;
  c = (c & M) + (j * u + k * t + l * s + m * r + n * q) * 5;
  d = c >>> 13;
  d += a + e * q + f * p + g * o + (h * x + i * w) * 5;
  a = d >>> 13;
  d = (d & M) + (j * v + k * u + l * t + m * s + n * r) * 5;
  to[2] = d & M;
  d = a + (d >>> 13) + e * r + f * q + g * p + h * o + i * x * 5;
  a = d >>> 13;
  d = (d & M) + (j * w + k * v + l * u + m * t + n * s) * 5;
  to[3] = d & M;
  d = a + (d >>> 13) + e * s + f * r + g * q + h * p + i * o;
  a = d >>> 13;
  d = (d & M) + (j * x + k * w + l * v + m * u + n * t) * 5;
  to[4] = d & M;
  d = a + (d >>> 13) + e * t + f * s + g * r + h * q + i * p;
  a = d >>> 13;
  d = (d & M) + j * o + (k * x + l * w + m * v + n * u) * 5;
  to[5] = d & M;
  d = a + (d >>> 13) + e * u + f * t + g * s + h * r + i * q;
  a = d >>> 13;
  d = (d & M) + j * p + k * o + (l * x + m * w + n * v) * 5;
  to[6] = d & M;
  d = a + (d >>> 13) + e * v + f * u + g * t + h * s + i * r;
  a = d >>> 13;
  d = (d & M) + j * q + k * p + l * o + (m * x + n * w) * 5;
  to[7] = d & M;
  d = a + (d >>> 13) + e * w + f * v + g * u + h * t + i * s;
  a = d >>> 13;
  d = (d & M) + j * r + k * q + l * p + m * o + n * x * 5;
  to[8] = d & M;
  d = a + (d >>> 13) + e * x + f * w + g * v + h * u + i * t;
  a = d >>> 13;
  d = (d & M) + j * s + k * r + l * q + m * p + n * o;
  to[9] = d & M;
  d >>>= 13;
  a = (a + d) * 5 + (b & M);
  to[0] = a & M;
  to[1] = (c & M) + (a >>> 13);
};
const rolled = (key: DataView, message: Uint8Array) => {
  let z = 0, a = key.getUint16(0, true), b = key.getUint16(2, true);
  const c = key.getUint16(4, true), d = new Uint16Array(10);
  const e = new Uint8Array(16), f = new Uint16Array(10), g = message.length;
  d[0] = a & M, d[1] = (a >> 13 | b << 3) & M, a = key.getUint16(6, true);
  d[2] = (b >> 10 | c << 6) & 0x1f03, d[3] = (c >> 7 | a << 9) & M;
  b = key.getUint16(8, true), d[4] = (a >> 4 | b << 12) & 0x00ff;
  d[5] = b >> 1 & 0x1ffe, a = key.getUint16(10, true);
  d[6] = (b >> 14 | a << 2) & M, b = key.getUint16(12, true);
  d[7] = (a >> 11 | b << 5) & 0x1f81, a = key.getUint16(14, true);
  d[8] = (b >> 8 | a << 8) & M, d[9] = a >> 5 & 0x007f;
  while (g - z > 15) block(d, message, f, 1 << 11, z), z += 16;
  if (z < g) e.set(message.subarray(z)), block(d, e, f, e[g - z]++, 0);
  a = f[1] >>> 13, z = 2;
  do f[z] += a, a = f[z] >>> 13, f[z] &= M; while (++z < 10);
  f[0] += a + (a << 2), f[z = 1] = (f[1] & M) + (f[0] >>> 13), f[0] &= M;
  f[2] += f[1] >>> 13, f[1] &= M, d[0] = f[0] + 5, a = d[0] >>> 13;
  do d[z] = f[z] + a, a = d[z] >>> 13, d[z] &= M; while (++z < 10);
  d[0] &= M, d[9] -= 1 << 13, a = -(a ^ 1), b = ~a;
  do f[--z] = f[z] & a | d[z] & b; while (z);
  f[a = b = 0] |= f[1] << 13, f[1] = f[1] >> 3 | f[2] << 10;
  f[2] = f[2] >> 6 | f[3] << 7, f[3] = f[3] >> 9 | f[4] << 4;
  f[4] = f[4] >> 12 | f[5] << 1 | f[6] << 14, f[5] = f[6] >> 2 | f[7] << 11;
  f[6] = f[7] >> 5 | f[8] << 8, f[7] = f[8] >> 8 | f[9] << 5;
  do e[b] = a = f[z] += key.getUint16(b++ + 16, true) + (a >> 16),
    e[b++] = f[z] >> 8; while (++z < 8);
  return e;
};
test("rolled version", (rng) => {
  const a = new Uint8Array(32), b = new DataView(a.buffer);
  for (let z = 0, c = new Uint8Array(0x800); z < c.length; ++z) {
    rng(a);
    const d = rng(c.subarray(0, z));
    assertEquals(poly(b, d), rolled(b, d), "same");
  }
});
