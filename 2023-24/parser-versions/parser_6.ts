import { u_b16 } from "../base/16.ts";
import { b62_u, u_b62 } from "../base/62.ts";
import { fnv1a, rbg } from "../base/hash.ts";
import { no, s_u, test, u_s } from "../base/text.ts";
import { chacha } from "../crypto/chacha.ts";
import { poly } from "../crypto/poly.ts";
import type { Data, Key } from "./lambda.ts";

type Part =
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
  A: number,
  B: number,
) => (B || no("Max >= 0", B),
  B > 65535 && no("Max <= 65535", B),
  A > B && no("Min <= max", `${A},${B}`));
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
  constructor(public parts: Part[]) {
    let a = [0], b = push.bind(a), c = "^(?=.{1,65535}$)(?<$>[0-9A-Za-z]{48})";
    let d = 0, e, f, g, h, z = 0, y;
    this.length = parts.length || no("1+ parts", parts);
    do switch ((c += `\\t(?<${b((e = parts[z])[0])}>`, a.push(e[1]), e)[1]) {
      case 0:
        c += "yes|no)", ++d;
        break;
      case 1:
        c += "\\d\\d?|1\\d\\d|2(?:[0-4]\\d|5[0-5]))", ++d;
        break;
      case 2:
        c += "\\d{1,10})", d += 4;
        break;
      case 3:
        c += "-?\\d+(?:\\.\\d+(?:e[+-]\\d+)?)?)", d += 8;
        break;
      case 4:
        c += (escape(h = e[2])) + ")", d += 2, y = 0;
        do b(h[y]); while (++y < h.length);
        a.push(0);
        break;
      case 5:
        c += `(?:(?:${escape(h = e[2])})(?:\\||(?=\\t|$))){0,${e[2].length}})`;
        d += 4, y = 0;
        do b(h[y]); while (++y < h.length);
        a.push(0);
        break;
      case 6:
        c += `[^\\n\\r\\t\\0]{${f = e[2]},${g = e[3]}})`;
        d += g + 2, validate(f, g), a.push(f, f >> 8, g, g >> 8);
        break;
      case 7:
        c += `(?:\\d{1,10}(?:,|(?=\\t|$))){${f = e[2]},${g = e[3]}})`;
        d += (g << 2) + 2, validate(f, g), a.push(f, f >> 8, g, g >> 8);
        break;
      case 8:
        c += `(?:-?\\d+(?:\\.\\d+(?:e[+-]\\d+)?)?(?:,|(?=\\t|$))){${f =
          e[2]},${g = e[3]}})`;
        d += (g << 3) + 2, validate(f, g), a.push(f, f >> 8, g, g >> 8);
        break;
      case 9:
        c += `(?:(?:${escape(h = e[4])})(?:\\||(?=\\t|$))){${f = e[2]},${g =
          e[3]}})`;
        d += (g << 1) + 2, validate(f, g), a.push(f, f >> 8, g, g >> 8), y = 0;
        do b(h[y]); while (++y < h.length);
        a.push(0);
    } while (++z < this.length);
    this.regex = RegExp(c + "$"), this.size = d, this.raw = new Uint8Array(a);
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
    for (let z = 0, y, x, c, d, e, f; z < count; ++z) {
      while (b.size === b.add(fnv1a(c = rbg())).size);
      d = u_b62(c), y = 0;
      do switch ((d += "\t", e = this.parts[y])[1]) {
        case 0:
          d += Math.random() > 0.5 ? "yes" : "no";
          break;
        case 1:
          d += Math.random() * 256 >>> 0;
          break;
        case 2:
          d += Math.random() * 0xffffffff >>> 0;
          break;
        case 3:
          d += Math.fround(Math.random() * 0xffffff);
          break;
        case 4:
          d += e[2][Math.random() * e[2].length | 0];
          break;
        case 5:
          x = 0, f = e[2];
          do if (Math.random() > 0.5) d += f[x] + "|"; while (++x < f.length);
          break;
        case 6:
          x = 0, f = e[3];
          do d += String.fromCharCode(Math.random() * 94 + 33); while (++x < f);
          break;
        case 7:
          x = 0, f = e[3];
          do d += (Math.random() * 0xffffffff >>> 0) + ","; while (++x < f);
          break;
        case 8:
          x = 0, f = e[3];
          do d += Math.fround(Math.random() * 0xffffff) + ","; while (++x < f);
          break;
        case 9:
          x = 0, f = e[4];
          do d += f[Math.random() * f.length | 0] + "|"; while (++x < e[3]);
      } while (++y < this.length);
      a[z] = d;
    }
    return a;
  }
  parse(string: string) {
    const a = this.regex.exec(string) ?? no(this.regex, string);
    const b = b62_u(a[1]), c: Data = { $$: b, $: fnv1a(b) };
    let d, e, f, g, h, z = 0, y = 2, x;
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
        c[`$${e[0]}`] = s_u(d);
        break;
      case 7:
        f = d.split(","), g = [], x = 0;
        do if (h = f[x]) g.push(+h); while (++x < f.length);
        c[`$${e[0]}`] = new Uint32Array(g);
        break;
      case 8:
        f = d.split(","), g = [], x = 0;
        do if (h = f[x]) g.push(+h); while (++x < f.length);
        c[`$${e[0]}`] = new Float64Array(g);
        break;
      case 9:
        f = d.split("|"), g = [], x = 0;
        do if (h = f[x]) g.push(e[4].indexOf(h)); while (++x < f.length);
        c[`$${e[0]}`] = new Uint16Array(g);
    } while (++y, ++z < this.length);
    return c;
  }
  stringify(data: Data, mask: boolean[] = []) {
    const a = new Uint8Array(8), b = new DataView(a.buffer);
    let c = u_b62(data.$$), d, e, f, g, h, z = 0, y;
    do switch ((c += "\t", d = mask[z], e = this.parts[z])[1]) {
      case 0:
        c += d
          ? data[e[0]].toString(16).padStart(2, "0")
          : data[e[0]] & 1
          ? "yes"
          : "no";
        break;
      case 1:
        c += d ? data[e[0]].toString(16).padStart(2, "0") : data[e[0]];
        break;
      case 2:
        c += d ? data[e[0]].toString(16).padStart(8, "0") : data[e[0]];
        break;
      case 3:
        c += d
          ? (b.setFloat64(0, data[e[0]], true),
            b.getUint32(0, true).toString(16).padStart(2, "0")
            + b.getUint32(4, true).toString(16).padStart(2, "0"))
          : data[e[0]];
        break;
      case 4:
        c += d ? data[e[0]].toString(16).padStart(4, "0") : e[2][data[e[0]]];
        break;
      case 5:
        if (d) c += data[e[0]].toString(16).padStart(8, "0");
        else {
          f = data[e[0]], g = "";
          while (f) g = e[2][h = 31 - Math.clz32(f)] + "|" + g, f &= ~(1 << h);
          c += g;
        }
        break;
      case 6:
        c += d ? u_b16(<U8> data[`$${e[0]}`]) : u_s(<U8> data[`$${e[0]}`]);
        break;
      case 7:
      case 8:
        if (d) c += u_b16(<U8> data[`$${e[0]}`]);
        else {
          f = data[`$${e[y = 0]}`];
          do c += f[y] + ","; while (++y < f.length);
        }
        break;
      case 9:
        if (d) c += u_b16(<U8> data[`$${e[0]}`]);
        else {
          f = data[`$${e[y = 0]}`];
          do c += e[4][f[y]] + "|"; while (++y < f.length);
        }
    } while (++z < this.length);
    return c;
  }
  encrypt(key: U8, iv: U8, mask: boolean[], data: Data) {
    const a = new Uint32Array(key.buffer), b = new Uint32Array(iv.buffer);
    const c = new Uint32Array(16), d = new Uint8Array(c.buffer);
    const e = new Uint8Array(this.size), f = new DataView(e.buffer);
    let g, h, i, j, k, z = 0, y = 0, x = 0, w, v;
    do switch ((g = mask[z] ? -1 : 0, h = this.parts[z])[1]) {
      case 0:
      case 1:
        (i = y++ & 0xf) || chacha(a, ++x, b, c), data[h[0]] ^= d[i] & g;
        break;
      case 2:
      case 5:
        f.setUint32(y, data[h[w = 0]], true);
        do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
          ++y, ++w < 4
        );
        data[h[0]] = f.getUint32(y - 4, true);
        break;
      case 3:
        f.setFloat64(y, data[h[w = 0]], true);
        do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
          ++y, ++w < 8
        );
        data[h[0]] = f.getFloat64(y - 8, true);
        break;
      case 4:
        f.setUint16(y, data[h[w = 0]], true);
        do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
          ++y, ++w < 2
        );
        data[h[0]] = f.getUint16(y - 2, true);
        break;
      case 6:
        e.set(j = data[`$${h[w = 0]}`], y);
        do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
          ++y, ++w < h[3]
        );
        if (g) {
          i = j.length, (j = new Uint8Array(w + 2)).set(e.subarray(y - w, y));
          j[0] = i, j[1] = i >> 8, data[`$${h[0]}`] = j;
        } else j.set(e.subarray(i = y - w, i + j.length));
        break;
      case 7:
        j = data[`$${h[w = 0]}`];
        do {
          f.setUint32(y, j[w], true), v = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
            ++y, ++v < 4
          );
          j[w] = f.getUint32(y - 4, true);
        } while (++w < j.length);
        if (g) {
          (k = new Uint8Array((h[3] << 2) + 2))[0] = j.length;
          k[1] = j.length >> 8;
          (data[`$${h[0]}`] = k).set(new Uint8Array(j.buffer), 2);
        }
        break;
      case 8:
        j = data[`$${h[w = 0]}`];
        do {
          f.setFloat64(y, j[w], true), v = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
            ++y, ++v < 8
          );
          j[w] = f.getFloat64(y - 8, true);
        } while (++w < j.length);
        if (g) {
          (k = new Uint8Array((h[3] << 3) + 2))[0] = j.length;
          k[1] = j.length >> 8;
          (data[`$${h[0]}`] = k).set(new Uint8Array(j.buffer), 2);
        }
        break;
      case 9:
        j = data[`$${h[w = 0]}`];
        do {
          f.setUint16(y, j[w], true), v = 0;
          do (i = y & 0xf) || chacha(a, ++x, b, c), e[y] ^= d[i] & g; while (
            ++y, ++v < 2
          );
          j[w] = f.getUint16(y - 2, true);
        } while (++w < j.length);
        if (g) {
          (k = new Uint8Array((h[3] << 1) + 2))[0] = j.length;
          k[1] = j.length >> 8;
          (data[`$${h[0]}`] = k).set(new Uint8Array(j.buffer), 2);
        }
    } while (++z < this.length);
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
  t("stringify", ({ expect }) => {
    for (let z = 0; z < Z; ++z) expect(a.stringify(c[z])).toBe(b[z]);
  });
});
