import { b62_n16, b62_n32, b62_u, n16_b62, n32_b62, u_b62 } from "../base/62.ts";
import { fnv1a } from "../base/hash.ts";
import { get } from "../base/mph.ts";
import { no, s_u, test, u_s } from "../base/text.ts";
import { chacha } from "../crypto/chacha.ts";
import type { Data, Key } from "./lambda.ts";

export type Part =
  | [Key, type: 0 | 2 | 3]
  | [Key, type: 4 | 5, options: string[]]
  | [Key, type: 1 | 6 | 7 | 8, min: number, max: number]
  | [Key, type: 9, min: number, max: number, options: string[]];
const clamp = (value: number, min = 1, max = 0xffff) =>
  value < min
    ? no(`Min ${min}`, value)
    : value > max
    ? no(`Max ${max}`, value)
    : value;
const OPTION = /^[^\n\t,]{1,255}$/, ESCAPE = /[$(-+./?[-^{|}]/g;
const escape = (options: string[]) => {
  let a = "", z = 0, Z = clamp(options.length);
  do a += "|" + test(OPTION, options[z]).replace(ESCAPE, "\\$&"); while (
    ++z < Z
  );
  return a.slice(1);
};
const KEY = /^[A-Za-z]\w{0,254}$/;
const push = (to: number[], value: string) => {
  let z = 0, a = s_u(value);
  to.push(a.length);
  do to.push(a[z]); while (++z < a.length);
};
const rbg = () => crypto.getRandomValues(new Uint8Array(32));
const between = (min: number, max: number) =>
  min + Math.random() * Math.ceil((max - min) / 2);
export class Parser {
  static raw(raw: U8) {
    clamp(raw.length);
    let a: Part[] = [], b, c, d, e, f, g, z = 0;
    do {
      b = <Key> u_s(raw.subarray(z + 1, z += raw[z] + 1));
      switch (c = raw[z++]) {
        case 0:
        case 2:
        case 3:
          a.push([b, c]);
          break;
        case 1:
          a.push([b, c, raw[z++], raw[z++]]);
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
  raw;
  id;
  patterns;
  regex;
  size;
  constructor(public parts: Part[]) {
    const a: number[] = [], b = push.bind(null, a);
    const c = Array<RegExp>(clamp(parts.length, 1, 0xff) + 1);
    let d = "^(?=.{1,65535}$)([0-9A-Za-z]{48})", e = 0;
    let f, g, h, i, j, z = 0, y;
    do switch ((b(test(KEY, (f = parts[z])[0])), a.push(f[1]), f)[1]) {
      case 0:
        g = "(?:yes|no)", ++e;
        break;
      case 1:
        a.push(y = clamp(f[2], 0, i = clamp(f[3], 0, 255)), i), g = "(?:";
        do g += y + "|"; while (++y <= i);
        g = g.slice(0, -1) + ")", ++e;
        break;
      case 2:
        g = "\\d{1,10}", e += 4;
        break;
      case 3:
        g = "-?\\d+(?:\\.\\d+)?", e += 8;
        break;
      case 4:
        g = `(?:${escape(h = f[2])})`, e += 2, y = 0;
        do b(h[y]); while (++y < h.length);
        a.push(0);
        break;
      case 5:
        g = `(?:(?:${escape(h = f[2])})(?:, |(?=\\t|$))){0,${h.length}}`;
        e += 4, y = 0;
        do b(h[y]); while (++y < h.length);
        a.push(0);
        break;
      case 6:
        g = `[^\\n\\t]{${i = f[2]},${j = f[3]}}`, e += j + 2;
        clamp(i, 0, clamp(j)), a.push(i, i >> 8, j, j >> 8);
        break;
      case 7:
        g = `(?:\\d{1,10}(?:, |(?=\\t|$))){${i = f[2]},${j = f[3]}}`;
        e += (j << 2) + 2, clamp(i, 0, clamp(j, 1, 0x3fff));
        a.push(i, i >> 8, j, j >> 8);
        break;
      case 8:
        g = `(?:-?\\d+(?:\\.\\d+)?(?:, |(?=\\t|$))){${i = f[2]},${j = f[3]}}`;
        e += (j << 3) + 2, clamp(i, 0, clamp(j, 1, 0x1fff));
        a.push(i, i >> 8, j, j >> 8);
        break;
      case 9:
        g = `(?:(?:${escape(h = f[4])})(?:, |(?=\\t|$))){${i = f[2]},${j =
          f[3]}}`, e += (j << 1) + 2;
        clamp(i, 0, clamp(j, 1, 0x7fff)), a.push(i, i >> 8, j, j >> 8), y = 0;
        do b(h[y]); while (++y < h.length);
        a.push(0);
    } while (d += `\\t(${g})`, c[++z] = RegExp(`^${g}$`), z < parts.length);
    this.id = fnv1a(this.raw = new Uint8Array(a));
    (this.patterns = c)[0] = /^[0-9A-Za-z]{48}$/;
    this.regex = RegExp(d + "$"), this.size = e;
  }
  random(count = 1) {
    const a = Array<string>(count), b = new Uint8Array(this.size);
    const c = new DataView(b.buffer);
    for (let z = 0, y, x, w, d = new Set([0]), e, f, g, h, i; z < count; ++z) {
      while (d.size === d.add(fnv1a(e = rbg())).size);
      f = u_b62(e), crypto.getRandomValues(b), y = x = 0;
      do switch ((f += "\t", g = this.parts[y])[1]) {
        case 0:
          f += b[x++] & 1 ? "yes" : "no";
          break;
        case 1:
          f += b[x++] % (g[3] - g[2]) + g[2];
          break;
        case 2:
          f += c.getUint32(x, true), x += 4;
          break;
        case 3:
          f += +(c.getUint32(x, true) * Math.random()).toFixed(1), x += 8;
          break;
        case 4:
          f += g[2][c.getUint16(x, true) % g[2].length], x += 2;
          break;
        case 5:
          w = (h = g[2]).length, i = c.getUint32(x, true), x += 4;
          do if (i & 1 << --w) f += h[w] + ", "; while (w);
          break;
        case 6:
          w = 0, h = between(g[2], g[3]);
          do f += String.fromCharCode(
            b[x] % 26 + (b[x] > 127 ? 65 : 97),
          ); while (++x, ++w < h);
          break;
        case 7:
          w = 0, h = between(g[2], g[3]);
          do f += c.getUint32(x, true) + ", "; while (x += 4, ++w < h);
          break;
        case 8:
          w = 0, h = between(g[2], g[3]);
          do f += +(c.getUint32(x, true) * Math.random()).toFixed(1)
            + ", "; while (x += 8, ++w < h);
          break;
        case 9:
          w = 0, h = g[4], i = between(g[2], g[3]);
          do f += h[c.getUint16(x, true) % h.length] + ", "; while (
            x += 2, ++w < i
          );
      } while (++y < this.parts.length);
      a[z] = f.replace(/, (?=\t|$)/g, "");
    }
    return a;
  }
  parse(string: string) {
    const a = this.regex.exec(string) ?? no(this.regex, string);
    const b = b62_u(a[1]), c: Data = { __proto__: null, $$: b, $: fnv1a(b) };
    let d, e, f, g, h, i, z = 0, y;
    do switch ((d = a[z + 2], e = this.parts[z])[1]) {
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
        f = d.split(", "), y = g = 0;
        do if (h = f[y]) g |= 1 << e[2].indexOf(h); while (++y < f.length);
        c[e[0]] = g;
        break;
      case 6:
        (c[`$${e[0]}`] = new Uint8Array(e[3])).set(f = s_u(d));
        c[e[0]] = f.length;
        break;
      case 7:
        f = d.split(", "), y = g = 0, h = new Uint32Array(e[3]);
        do if (i = f[y]) h[g++] = +i; while (++y < e[3]);
        c[`$${e[0]}`] = h, c[e[0]] = g;
        break;
      case 8:
        f = d.split(", "), y = g = 0, h = new Float64Array(e[3]);
        do if (i = f[y]) h[g++] = +i; while (++y < e[3]);
        c[`$${e[0]}`] = h, c[e[0]] = g;
        break;
      case 9:
        f = d.split(", "), y = g = 0, h = new Uint16Array(e[3]);
        do if (i = f[y]) h[g++] = e[4].indexOf(i); while (++y < e[3]);
        c[`$${e[0]}`] = h, c[e[0]] = g;
    } while (++z < this.parts.length);
    return c;
  }
  encrypt(seeds: U32, mask: Record<string, boolean>, data: Data) {
    const a = data.$$, b = crypto.getRandomValues(new Uint8Array(12));
    const c = new Uint32Array(a.buffer), d = new Uint32Array(b.buffer);
    const e = new Uint32Array(16), f = new Uint8Array(e.buffer);
    const g = new Uint8Array(this.size), h = new DataView(g.buffer);
    let i = n32_b62(get(seeds, b)), j, k, l, m, n, z = 0, y = 0, x = 0, w, v;
    do if (i += "\t", mask[k = (j = this.parts[z])[0]]) {
      switch (j[1]) {
        case 0:
        case 1:
          (l = y++ & 0xf) || chacha(c, ++x, d, e), i += n16_b62(data[k] ^ f[l]);
          break;
        case 2:
        case 5:
          h.setUint32(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 4
          );
          i += n32_b62(h.getUint32(y - 4, true));
          break;
        case 3:
          h.setFloat64(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 8
          );
          i += n32_b62(h.getUint32(y - 8, true))
            + n32_b62(h.getUint32(y - 4, true));
          break;
        case 4:
          h.setUint16(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 2
          );
          i += n16_b62(h.getUint16(y - 2, true));
          break;
        case 6:
          h.setUint16(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 2
          );
          i += n16_b62(h.getUint16(y - 2, true));
          g.set(data[`$${k}`], y), w = 0, m = j[3];
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < m
          );
          i += u_b62(g.subarray(y - m, y));
          break;
        case 7:
          h.setUint16(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 2
          );
          i += n16_b62(h.getUint16(y - 2, true));
          w = 0, m = j[3], n = data[`$${k}`];
          do {
            h.setUint32(y, n[w], true), v = 0;
            do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
              ++y, ++v < 4
            );
            i += n32_b62(h.getUint32(y - 4, true));
          } while (++w < m);
          break;
        case 8:
          h.setUint16(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 2
          );
          i += n16_b62(h.getUint16(y - 2, true));
          w = 0, m = j[3], n = data[`$${k}`];
          do {
            h.setFloat64(y, n[w], true), v = 0;
            do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
              ++y, ++v < 8
            );
            i += n32_b62(h.getUint32(y - 8, true))
              + n32_b62(h.getUint32(y - 4, true));
          } while (++w < m);
          break;
        case 9:
          h.setUint16(y, data[k], true), w = 0;
          do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
            ++y, ++w < 2
          );
          i += n16_b62(h.getUint16(y - 2, true));
          w = 0, m = j[3], n = data[`$${k}`];
          do {
            h.setUint16(y, n[w], true), v = 0;
            do (l = y & 0xf) || chacha(c, ++x, d, e), g[y] ^= f[l]; while (
              ++y, ++v < 2
            );
            i += n16_b62(h.getUint16(y - 2, true));
          } while (++w < m);
      }
    } else {
      switch (j[1]) {
        case 0:
          i += data[k] & 1 ? "yes" : "no";
          break;
        case 1:
        case 2:
        case 3:
          i += data[k];
          break;
        case 4:
          i += j[2][data[k]];
          break;
        case 5:
          if (w = data[k]) {
            do i += j[2][l = 31 - Math.clz32(w)] + ", "; while (w &= ~(1 << l));
            i = i.slice(0, -2);
          }
          break;
        case 6:
          i += u_s(<U8> data[`$${k}`].subarray(0, data[k]));
          break;
        case 7:
        case 8:
          i += data[`$${k}`].subarray(0, data[k]).join(", ");
          break;
        case 9:
          w = 0, l = data[k], m = data[`$${k}`];
          while (w < l) i += j[4][m[w++]] + ", ";
          l && (i = i.slice(0, -2));
      }
    } while (++z < this.parts.length);
    return i + "\t" + u_b62(b);
  }
  decrypt(mask: Record<string, boolean>, key: U8, string: string) {
    let [_, ...a] = string.split("\t"), b = new Uint32Array(key.buffer);
    const c = new Uint32Array(b62_u(a[a.length - 1]).buffer);
    const d = new Uint32Array(16), e = new Uint8Array(d.buffer);
    const f = new Uint8Array(this.size), g = new DataView(f.buffer);
    let h = u_b62(key), i, j, k, l, m, n, z = 0, y = 0, x = 0, w, v;
    do if (h += "\t", mask[(i = this.parts[z])[0]]) {
      switch (i[1]) {
        case 0:
          (j = y++ & 0xf) || chacha(b, ++x, c, d);
          h += (b62_n16(a[z]) ^ e[j]) & 1 ? "yes" : "no";
          break;
        case 1:
          (j = y++ & 0xf) || chacha(b, ++x, c, d), h += b62_n16(a[z]) ^ e[j];
          break;
        case 2:
          g.setUint32(y, b62_n32(a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 4
          );
          h += g.getUint32(y - 4, true);
          break;
        case 3:
          g.setUint32(y, b62_n32(a[z]), true);
          g.setUint32(y + 4, b62_n32(a[z], 6), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 8
          );
          h += g.getFloat64(y - 8, true);
          break;
        case 4:
          g.setUint16(y, b62_n16(a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 2
          );
          h += i[2][g.getUint16(y - 2, true)];
          break;
        case 5:
          g.setUint32(y, b62_n32(a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 4
          );
          if (w = g.getUint32(y - 4, true)) {
            do h += i[2][j = 31 - Math.clz32(w)] + ", "; while (w &= ~(1 << j));
            h = h.slice(0, -2);
          }
          break;
        case 6:
          g.setUint16(y, b62_n16(a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 2
          );
          f.set(b62_u(a[z].slice(3)), y), w = 0, k = i[3];
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < k
          );
          h += u_s(f.subarray(k = y - k, k + g.getUint16(k - 2, true)));
          break;
        case 7:
          g.setUint16(y, b62_n16(l = a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 2
          );
          w = 0, k = i[3], m = 3, n = g.getUint16(y - 2, true);
          do {
            g.setUint32(y, b62_n32(l, m), true), m += 6, v = 0;
            do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
              ++y, ++v < 4
            );
            w < n && (h += g.getUint32(y - 4, true) + ", ");
          } while (++w < k);
          h[h.length - 1] === " " && (h = h.slice(0, -2));
          break;
        case 8:
          g.setUint16(y, b62_n16(l = a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 2
          );
          w = 0, k = i[3], m = 3, n = g.getUint16(y - 2, true);
          do {
            g.setUint32(y, b62_n32(l, m), true);
            g.setUint32(y + 4, b62_n32(l, m += 6), true), m += 6, v = 0;
            do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
              ++y, ++v < 8
            );
            w < n && (h += g.getFloat64(y - 8, true) + ", ");
          } while (++w < k);
          h[h.length - 1] === " " && (h = h.slice(0, -2));
          break;
        case 9:
          g.setUint16(y, b62_n16(l = a[z]), true), w = 0;
          do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
            ++y, ++w < 2
          );
          w = 0, k = i[3], m = 3, n = g.getUint16(y - 2, true);
          do {
            g.setUint16(y, b62_n16(l, m), true), m += 3, v = 0;
            do (j = y & 0xf) || chacha(b, ++x, c, d), f[y] ^= e[j]; while (
              ++y, ++v < 2
            );
            w < n && (h += i[4][g.getUint16(y - 2, true)] + ", ");
          } while (++w < k);
          h[h.length - 1] === " " && (h = h.slice(0, -2));
      }
    } else h += a[z]; while (++z < this.parts.length);
    return h;
  }
}

import.meta.vitest?.describe("parser", t => {
  const a = new Parser([
    ["boolean", 0],
    ["char", 1, 1, 100],
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
  t("encode and decode to same parser", ({ expect }) => {
    expect(Parser.raw(a.raw).id).toBe(a.id);
  });
  t("illegal parser fails", ({ expect }) => {
    expect(() => Parser.raw(new Uint8Array())).toThrow();
  });
  t("bad parts fails", ({ expect }) => {
    expect(() => new Parser([])).toThrow();
    expect(() => new Parser([["a", 4, []]])).toThrow();
    expect(() => new Parser([["a", 4, Array(65536)]])).toThrow();
    expect(() => new Parser([["a", 6, 0, 0]])).toThrow();
    expect(() => new Parser([["a", 6, 2, 1]])).toThrow();
    expect(() => new Parser([["a", 6, 0, 65536]])).toThrow();
    expect(() => a.parse("")).toThrow();
  });
  t("random generates matching string", ({ expect }) => {
    let z = 0;
    do expect(b[z]).toMatch(a.regex); while (++z < Z);
  });
  t("no key collisions", ({ expect }) => {
    const d = new Set<number>();
    for (let z = 0; z < Z; ++z) d.add((c[z] = a.parse(b[z])).$);
    expect(d.size).toBe(Z);
  });
  t("encrypt some of string, decrypt to same string", async ({ expect }) => {
    const { set } = await import("../base/mph.ts");
    const d = Array<string>(Z);
    for (let z = 0; z < Z; ++z) d[z] = b[z].slice(0, 48);
    const e = set(d), f = a.parts.map(A => A[0]);
    for (let z = 0; z < 8; ++z) {
      const g: Record<string, boolean> = {};
      for (let y = 0; y < f.length; ++y) g[f[y]] = Math.random() > 0.5;
      for (let y = 0; y < Z; ++y) {
        const h = a.encrypt(e, g, c[z]);
        const i = h.split("\t").slice(1, -1);
        const j = b[z].split("\t").slice(1);
        for (let x = 0; x < f.length; ++x) {
          g[f[x]] ? expect(i[x]).not.toBe(j[x]) : expect(i[x]).toBe(j[x]);
        }
        expect(a.decrypt(g, c[z].$$, h)).toBe(b[z]);
      }
    }
  });
});
