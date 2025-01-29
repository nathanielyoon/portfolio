import { b62_n16, b62_n32, b62_n8, b62_u, n16_b62, n32_b62, n8_b62, u_b62 } from "../base/62.ts";
import { fnv1a, rbg } from "../base/hash.ts";
import { no, s_u, test, u_s } from "../base/text.ts";
import { chacha } from "../crypto/chacha.ts";
import type { Data, Key } from "./lambda.ts";

export type Part =
  | [Key, type: 0 | 1 | 2 | 3]
  | [Key, type: 4 | 5, options: string[]]
  | [Key, type: 6 | 7 | 8, minimum: number, maximum: number]
  | [Key, type: 9, minimum: number, maximum: number, options: string[]];
const escape = (options: string[]) => {
  let a = "", z = 0, Z = options.length || no("1+ options", options);
  Z > 65535 && no("Options <= 65535", Z);
  do a += "|" + test(/^[^|]{1,255}$/, options[z])
    .replace(/[$(-+./?[-^{|}]/g, "\\$&"); while (++z < Z);
  return a.slice(1);
};
const validate = (
  minimum: number,
  maximum: number,
  maximum_maximum: number,
) => (maximum || no("Max >= 0", maximum),
  maximum > maximum_maximum && no("Max <= " + maximum_maximum, maximum),
  minimum > maximum && no("Min <= max", `${minimum},${maximum}`));
function push(this: number[], value: string) {
  const a = s_u(value), Z = a.length;
  this.push(Z);
  for (let z = 0; z < Z; ++z) this.push(a[z]);
  return value;
}
export class Parser {
  static raw(raw: U8) {
    raw[0] && no("Zero byte", raw[0]), raw.length > 1 || no("1+ parts", raw);
    let a: Part[] = [], b, c, d, e, f, g, z = 1;
    do {
      b = <Key> u_s(raw.subarray(z + 1, z += raw[z] + 1));
      switch (c = raw[z++]) {
        case 0:
        case 1:
        case 2:
        case 3:
          a.push([b, c]);
          break;
        case 4:
        case 5:
          d = [];
          while (e = raw[z++]) d.push(u_s(raw.subarray(z, z += e)));
          a.push([b, c, d]);
          break;
        case 6:
        case 7:
        case 8:
          a.push([b, c, raw[z++] | raw[z++] << 8, raw[z++] | raw[z++] << 8]);
          break;
        case 9:
          f = raw[z++] | raw[z++] << 8, g = raw[z++] | raw[z++] << 8, d = [];
          while (e = raw[z++]) d.push(u_s(raw.subarray(z, z += e)));
          a.push([b, c, f, g, d]);
      }
    } while (z < raw.length);
    return new Parser(a);
  }
  length;
  regex;
  size;
  raw;
  patterns;
  constructor(public parts: Part[]) {
    let a = [0], b = push.bind(a), c = "^(?=.{1,65535}$)(?<$>[0-9A-Za-z]{48})";
    const d = Array(this.length = parts.length || no("1+ parts", parts));
    let e = 0, f, g, h, i, z = 0, y;
    do switch ((c += `\\t(?<${b((f = parts[z])[0])}>`, a.push(f[1]), f)[1]) {
      case 0:
        c += d[z] = "yes|no", ++e;
        break;
      case 1:
        c += d[z] = "\\d\\d?|1\\d\\d|2(?:[0-4]\\d|5[0-5])", ++e;
        break;
      case 2:
        c += d[z] = "\\d{1,10}", e += 4;
        break;
      case 3:
        c += d[z] = "-?\\d+(?:\\.\\d+(?:e[+-]\\d+)?)?", e += 8;
        break;
      case 4:
        c += d[z] = escape(i = f[2]), e += 2, y = 0;
        do b(i[y]); while (++y < i.length);
        a.push(0);
        break;
      case 5:
        c += d[z] = `(?:(?:${escape(i = f[2])})(?:\\||(?=\\t|$))){0,${
          f[2].length
        }}`;
        e += 4, y = 0;
        do b(i[y]); while (++y < i.length);
        a.push(0);
        break;
      case 6:
        c += d[z] = `[^\\n\\r\\t\\0]{${g = f[2]},${h = f[3]}}`;
        e += h + 2, validate(g, h, 0xffff), a.push(g, g >> 8, h, h >> 8);
        break;
      case 7:
        c += d[z] = `(?:\\d{1,10}(?:\\||(?=\\t|$))){${g = f[2]},${h = f[3]}}`;
        e += (h << 2) + 2, validate(g, h, 0x3fff), a.push(g, g >> 8, h, h >> 8);
        break;
      case 8:
        c += d[z] = `(?:-?\\d+(?:\\.\\d+(?:e[+-]\\d+)?)?(?:\\||(?=\\t|$))){${g =
          f[2]},${h = f[3]}}`;
        e += (h << 3) + 2, validate(g, h, 0x1fff), a.push(g, g >> 8, h, h >> 8);
        break;
      case 9:
        c += d[z] = `(?:(?:${escape(i = f[4])})(?:\\||(?=\\t|$))){${g =
          f[2]},${h = f[3]}}`;
        e += (h << 1) + 2, validate(g, h, 0x7fff), a.push(g, g >> 8, h, h >> 8);
        y = 0;
        do b(i[y]); while (++y < i.length);
        a.push(0);
    } while (c += ")", ++z < this.length);
    this.regex = RegExp(c + "$"), this.size = e, this.raw = new Uint8Array(a);
    z = 0;
    do d[z] = RegExp("^(?:" + d[z] + ")$"); while (++z < this.length);
    (this.patterns = <RegExp[]> d).unshift(/^[0-9A-Za-z]{48}$/);
  }
  get id() {
    return fnv1a(this.raw);
  }
  get keys() {
    let a = Array<Key>(this.length), z = 0;
    do a[z] = this.parts[z][0]; while (++z < this.length);
    return a;
  }
  random(count = 1) {
    const a = Array<string>(count), b = new Set([0]);
    const c = new Uint8Array(this.size), d = new DataView(c.buffer);
    for (let z = 0, y, x, w, e, f, g, h, i; z < count; ++z) {
      while (b.size === b.add(fnv1a(e = rbg())).size);
      f = u_b62(e), crypto.getRandomValues(c), y = x = 0;
      do switch ((f += "\t", g = this.parts[y])[1]) {
        case 0:
          f += c[x++] & 1 ? "yes" : "no";
          break;
        case 1:
          f += c[x++];
          break;
        case 2:
          f += d.getUint32(x, true), x += 4;
          break;
        case 3:
          f += (d.getUint32(x, true) * Math.random()).toFixed(1), x += 8;
          break;
        case 4:
          f += g[2][d.getUint16(x, true) % g[2].length], x += 2;
          break;
        case 5:
          w = (h = g[2]).length, i = d.getUint32(x, true), x += 4;
          do if (i & 1 << --w) f += h[w] + "|"; while (w);
          break;
        case 6:
          w = 0, h = Math.min(10, g[3]);
          do f += String.fromCharCode(
            c[x] % 26 + (c[x] > 127 ? 65 : 97),
          ); while (++x, ++w < h);
          break;
        case 7:
          w = 0, h = Math.min(g[2] + 2, g[3]);
          do f += d.getUint32(x, true) + "|"; while (x += 4, ++w < h);
          break;
        case 8:
          w = 0, h = Math.min(g[2] + 1, g[3]);
          do f += (d.getUint32(x, true) * Math.random()).toFixed(1)
            + "|"; while (x += 8, ++w < h);
          break;
        case 9:
          w = 0, h = g[4], i = Math.min(g[2] + 3, g[3]);
          do f += h[d.getUint16(x, true) % h.length] + "|"; while (
            x += 2, ++w < i
          );
      } while (++y < this.length);
      a[z] = f;
    }
    return a;
  }
  parse(string: string) {
    const a = this.regex.exec(string) ?? no(this.regex, string);
    const b = b62_u(a[1]), c: Data = { $$: b, $: fnv1a(b), __proto__: null };
    let d, e, f, g, h, i, z = 0, y = 2, x;
    do switch ((d = a[y], e = this.parts[z])[1]) {
      case 0:
        c[e[0]] = d === "no" ? 0 : 1;
        break;
      case 1:
      case 2:
      case 3:
        c[e[0]] = +d;
        break;
      case 4:
        c[e[0]] = e[2].indexOf(d);
        break;
      case 5:
        f = d.split("|"), x = g = 0;
        do if (h = f[x]) g |= 1 << e[2].indexOf(h); while (++x < f.length);
        c[e[0]] = g;
        break;
      case 6:
        (c[`$${e[0]}`] = new Uint8Array(e[3])).set(f = s_u(d));
        c[e[0]] = f.length;
        break;
      case 7:
        f = d.split("|"), x = g = 0, h = new Uint32Array(e[3]);
        do if (i = f[x]) h[g++] = +i; while (++x < e[3]);
        c[`$${e[0]}`] = h, c[e[0]] = g;
        break;
      case 8:
        f = d.split("|"), x = g = 0, h = new Float64Array(e[3]);
        do if (i = f[x]) h[g++] = +i; while (++x < e[3]);
        c[`$${e[0]}`] = h, c[e[0]] = g;
        break;
      case 9:
        f = d.split("|"), x = g = 0, h = new Uint16Array(e[3]);
        do if (i = f[x]) h[g++] = e[4].indexOf(i); while (++x < e[3]);
        c[`$${e[0]}`] = h, c[e[0]] = g;
    } while (++y, ++z < this.length);
    return c;
  }
  encrypt(iv: U8, mask: boolean[], data: Data) {
    const a = new Uint32Array(data.$$.buffer), b = new Uint32Array(iv.buffer);
    const c = new Uint32Array(16), d = new Uint8Array(c.buffer);
    const e = new Uint8Array(this.size), f = new DataView(e.buffer);
    let g = n32_b62(data.$), h, i, j, k, z = 0, y = 0, x = 0, w, v;
    do switch ((g += "\t", h = mask[z], i = this.parts[z])[1]) {
      case 0:
        if (h) {
          (j = y++ & 0xf) || chacha(a, ++x, b, c);
          g += n8_b62(data[i[0]] ^ d[j]);
        } else g += data[i[0]] & 1 ? "yes" : "no";
        break;
      case 1:
        if (h) {
          (j = y++ & 0xf) || chacha(a, ++x, b, c);
          g += n8_b62(data[i[0]] ^ d[j]);
        } else g += data[i[0]];
        break;
      case 2:
        if (h) {
          f.setUint32(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 4
          );
          g += n32_b62(f.getUint32(y - 4, true));
        } else g += data[i[0]];
        break;
      case 3:
        if (h) {
          f.setFloat64(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 8
          );
          g += n32_b62(f.getUint32(y - 8, true))
            + n32_b62(f.getUint32(y - 4, true));
        } else g += data[i[0]];
        break;
      case 4:
        if (h) {
          f.setUint16(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 2
          );
          g += n16_b62(f.getUint16(y - 2, true));
        } else g += i[2][data[i[0]]];
        break;
      case 5:
        if (h) {
          f.setUint32(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 4
          );
          g += n32_b62(f.getUint32(y - 4, true));
        } else {
          w = data[i[0]];
          while (w) g += i[2][j = 31 - Math.clz32(w)] + "|", w &= ~(1 << j);
        }
        break;
      case 6:
        if (h) {
          f.setUint16(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 2
          );
          g += n16_b62(f.getUint16(y - 2, true));
          e.set(data[`$${i[w = 0]}`], y);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < i[3]
          );
          g += u_b62(e.subarray(y - w, y));
        } else g += u_s(<U8> data[`$${i[0]}`].subarray(0, data[i[0]]));
        break;
      case 7:
        if (h) {
          f.setUint16(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 2
          );
          g += n16_b62(f.getUint16(y - 2, true));
          k = data[`$${i[w = 0]}`];
          do {
            f.setUint32(y, k[w], true), v = 0;
            do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
              ++v < 4
            );
            g += n32_b62(f.getUint32(y - 4, true));
          } while (++w < i[3]);
        } else {
          j = data[i[0]], k = data[`$${i[w = 0]}`];
          do g += k[w] + "|"; while (++w < j);
        }
        break;
      case 8:
        if (h) {
          f.setUint16(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 2
          );
          g += n16_b62(f.getUint16(y - 2, true));
          k = data[`$${i[w = 0]}`];
          do {
            f.setFloat64(y, k[w], true), v = 0;
            do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
              ++v < 8
            );
            g += n32_b62(f.getUint32(y - 8, true))
              + n32_b62(f.getUint32(y - 4, true));
          } while (++w < i[3]);
        } else {
          j = data[i[0]], k = data[`$${i[w = 0]}`];
          do g += k[w] + "|"; while (++w < j);
        }
        break;
      case 9:
        if (h) {
          f.setUint16(y, data[i[w = 0]], true);
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < 2
          );
          g += n16_b62(f.getUint16(y - 2, true));
          k = data[`$${i[w = 0]}`];
          do {
            f.setUint16(y, k[w], true), v = 0;
            do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
              ++v < 2
            );
            g += n16_b62(f.getUint16(y - 2, true));
          } while (++w < i[3]);
        } else {
          j = data[i[0]], k = data[`$${i[w = 0]}`];
          do g += i[4][k[w]] + "|"; while (++w < j);
        }
    } while (++z < this.length);
    return g;
  }
  decrypt(key: U8, iv: U8, mask: boolean[], data: string) {
    const a = new Uint32Array(key.buffer), b = new Uint32Array(iv.buffer);
    const c = new Uint32Array(16), d = new Uint8Array(c.buffer);
    const e = new Uint8Array(this.size), f = new DataView(e.buffer);
    let g = data.split("\t").slice(1), h, i, j, k, z = 0, y = 0, x = 0, w, v, u;
    do if (mask[z]) {
      switch ((h = this.parts[z])[1]) {
        case 0:
          (i = y++ & 0xf) || chacha(a, ++x, b, c);
          g[z] = (b62_n8(g[z]) ^ d[i]) & 1 ? "yes" : "no";
          break;
        case 1:
          (i = y++ & 0xf) || chacha(a, ++x, b, c);
          g[z] = String(b62_n8(g[z]) ^ d[i]);
          break;
        case 2:
          f.setUint32(y, b62_n32(g[z]), true), w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 4
          );
          g[z] = String(f.getUint32(y - 4, true));
          break;
        case 3:
          f.setUint32(y, b62_n32(g[z]), true), w = 0;
          f.setUint32(y + 4, b62_n32(g[z], 6), true);
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 8
          );
          g[z] = String(f.getFloat64(y - 8, true));
          break;
        case 4:
          f.setUint16(y, b62_n16(g[z]), true), w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 2
          );
          g[z] = h[2][f.getUint16(y - 2, true)];
          break;
        case 5:
          f.setUint32(y, b62_n32(g[z]), true), w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 4
          );
          i = f.getUint32(y - 4, true), g[z] = "";
          while (i) g[z] += h[2][j = 31 - Math.clz32(i)] + "|", i &= ~(1 << j);
          break;
        case 6:
          f.setUint16(y, b62_n16(g[z]), true), w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 2
          );
          i = f.getUint16(y - 2, true), e.set(b62_u(g[z].slice(3)), y), w = 0;
          do (j = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[j]; while (
            ++w < i
          );
          g[z] = u_s(e.subarray(y - w, y));
          break;
        case 7:
          f.setUint16(y, b62_n16(g[z]), true), v = w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 2
          );
          i = f.getUint16(y - 2, true), j = "", w = 3;
          while (v < i) {
            f.setUint32(y, b62_n32(g[z], w), true), w += 6, u = 0;
            do (k = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[k]; while (
              ++u < 4
            );
            j += f.getUint32(y - 4, true) + "|", ++v;
          }
          g[z] = j;
          break;
        case 8:
          f.setUint16(y, b62_n16(g[z]), true), v = w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 2
          );
          i = f.getUint16(y - 2, true), j = "", w = 3;
          while (v < i) {
            f.setUint32(y, b62_n32(g[z], w), true), u = 0;
            f.setUint32(y + 4, b62_n32(g[z], w += 6), true), w += 6;
            do (k = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[k]; while (
              ++u < 8
            );
            j += f.getFloat64(y - 8, true) + "|", ++v;
          }
          g[z] = j;
          break;
        case 9:
          f.setUint16(y, b62_n16(g[z]), true), v = w = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[i]; while (
            ++w < 2
          );
          i = f.getUint16(y - 2, true), j = "", w = 3;
          while (v < i) {
            f.setUint16(y, b62_n16(g[z], w), true), u = 0, w += 3;
            do (k = y & 0xf) || chacha(a, ++x, b, c), e[y++] ^= d[k]; while (
              ++u < 2
            );
            j += h[4][f.getUint16(y - 2, true)] + "|", ++v;
          }
          g[z] = j;
      }
    } while (++z < this.length);
    return u_b62(key) + "\t" + g.join("\t");
  }
}

import.meta.vitest?.describe("parser", t => {
  const a = new Parser([
    ["boolean", 0],
    ["char", 1],
    ["uint32", 2],
    ["float64", 3],
    ["enum", 4, ["A", "B", "C", "D", "E"]],
    ["bitset", 5, ["0", "1", "2", "3", "4", "5", "6", "7"]],
    ["string", 6, 1, 32],
    ["uint32array", 7, 0, 3],
    ["float64array", 8, 0, 2],
    ["array", 9, 1, 4, ["a", "b", "c"]],
  ]);
  const Z = 1e3, b = a.random(Z), c = Array<Data>(Z);
  t("raw", ({ expect }) => {
    expect(Parser.raw(a.raw).id).toBe(a.id);
    expect(() => Parser.raw(new Uint8Array())).toThrow();
    expect(() => Parser.raw(new Uint8Array([1]))).toThrow();
  });
  t("bad", ({ expect }) => {
    expect(() => new Parser([])).toThrow();
    expect(() => new Parser([["a", 4, []]])).toThrow();
    expect(() => new Parser([["a", 4, Array(65536)]])).toThrow();
    expect(() => new Parser([["a", 6, 0, 0]])).toThrow();
    expect(() => new Parser([["a", 6, 2, 1]])).toThrow();
    expect(() => new Parser([["a", 6, 0, 65536]])).toThrow();
    expect(() => a.parse("")).toThrow();
  });
  t("keys", ({ expect }) => {
    expect(a.keys).toEqual(a.parts.map(A => A[0]));
  });
  t("random", ({ expect }) => {
    for (let z = 0; z < Z; ++z) expect(b[z]).toMatch(a.regex);
  });
  t("parse", ({ expect }) => {
    const d = new Set<number>();
    for (let z = 0; z < Z; ++z) d.add((c[z] = a.parse(b[z])).$);
    expect(d.size).toBe(Z);
  });
  t("encrypt decrypt", ({ expect }) => {
    const d = crypto.getRandomValues(new Uint8Array(12));
    const e = [true, false, false, false, true, true, false, true, false, true];
    const f = [true, false, true, false, true, true, true, true, false, false];
    const g = [true, true, true, true, true, true, true, true, true, true];
    for (const i of [e, f, g]) {
      for (let z = 0; z < Z; ++z) {
        const j = c[z], k = j.$$, l = a.encrypt(d, i, j);
        expect(l.split("\t").slice(1)).not.toEqual(b[z].split("\t").slice(1));
        expect(a.decrypt(k, d, i, l)).toBe(b[z]);
      }
    }
  });
});
