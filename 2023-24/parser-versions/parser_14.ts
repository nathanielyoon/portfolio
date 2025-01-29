import { b62_u, n32_b62, u_b62 } from "../base/62.ts";
import { crc, fnv1a } from "../base/hash.ts";
import { query } from "../base/mph.ts";
import { no, s_u, test, u_s } from "../base/text.ts";

export type Part = [
  Key,
  ...(
    | [type: 0 | 2]
    | [type: 3 | 4, options: string[]]
    | [type: 1 | 5 | 6, min: number, max: number]
    | [type: 7, min: number, max: number, options: string[]]
  ),
];
/** Backslash-escapes regular expression special characters. */
const escape = (options: string[]) => {
  let a = "", z = 0, Z = options.length || options.push("");
  do a += "|" + (/^[^\n\t, ][^\n\t,]{0,254}$/.exec(options[z])?.[0]
    .replace(/[$(-+./?[-^{|}]/g, "\\$&") ?? ""); while (++z < Z);
  return `(?:${a.slice(1)})`;
};
/** Adds a string's bytes to an array. */
function push(this: number[], value: string) {
  let z = 0, a = s_u(value), Z = a.length;
  this.push(Z);
  do this.push(a[z]); while (++z < Z);
}
/** Picks a random-ish value between two bounds, inclusive. */
const between = (min: number, max: number) =>
  min + Math.random() * Math.ceil((max - min) / 2);
export class Parser {
  /** Converts a Uint8Array to a parser object. */
  static raw_(path: string, raw: U8) {
    let a: Part[] = [], b, c, d, e, f, g, h, z = 0;
    while (z < raw.length) {
      b = raw[z++];
      c = test<Key>(
        path + " > parser > keys",
        /^[A-Z]\w{0,254}$/i,
        u_s(raw.subarray(z, z += b)),
      );
      if (c instanceof Error) return c;
      switch (d = raw[z++]) {
        case 0:
        case 2:
          a.push([c, d]);
          break;
        case 1:
          a.push([c, d, raw[z++], raw[z++]]);
          break;
        case 3:
        case 4:
          e = [];
          while (f = raw[z++]) e.push(u_s(raw.subarray(z, z += f)));
          a.push([c, d, e]);
          break;
        case 5:
        case 6:
          a.push([c, d, raw[z++] | raw[z++] << 8, raw[z++] | raw[z++] << 8]);
          break;
        case 7:
          e = raw[z++] | raw[z++] << 8, f = raw[z++] | raw[z++] << 8, g = [];
          while (h = raw[z++]) g.push(u_s(raw.subarray(z, z += h)));
          a.push([c, d, e, f, g]);
      }
    }
    return new Parser(a);
  }
  patterns_;
  raw_;
  id_;
  regex_;
  buffer_;
  view_;
  /** Generates regular expression and byte representations for a set of parts. */
  constructor(public parts: Part[]) {
    const a = Array<RegExp>(parts.length), b: number[] = [], c = push.bind(b);
    let d = "^(?=.{1,65535}$)([0-9A-Za-z]{45})", e = 0, f, g, h, i, j, z = 0, y;
    do switch ((c((f = parts[z])[0]), b.push(f[1]), f)[1]) {
      case 0:
        g = "(?:yes|no)", ++e;
        break;
      case 1:
        g = "(?:" + String(h = f[2]), b.push(h, i = f[3]), ++e;
        while (++h <= i) g += "|" + h;
        g += ")";
        break;
      case 2:
        g = "-?\\d+(?:\\.\\d+(?:[+-]e\\d+)?)?", e += 8;
        break;
      case 3:
        g = escape(h = f[2]), e += 2, y = 0;
        do c(h[y]); while (++y < h.length);
        b.push(0);
        break;
      case 4:
        g = `(?:${escape(h = f[2])}(?:, ?|(?=\\t|$))){0,${h.length}}`, e += 4;
        y = 0;
        do c(h[y]); while (++y < h.length);
        b.push(0);
        break;
      case 5:
        g = `[^\\n\\t]{${h = f[2]},${i = f[3]}}`, b.push(h, h >> 8, i, i >> 8);
        e += i + 2;
        break;
      case 6:
        g = `(?:-?\\d+(?:\\.\\d+(?:[+-]e\\d+)?)?(?:, ?|(?=\\t|$))){${h =
          f[2]},${i = f[3]}}`, b.push(h, h >> 8, i, i >> 8);
        e += (i << 3) + 2;
        break;
      case 7:
        g = `(?:${escape(h = f[4])}(?:, ?|(?=\\t|$))){${i = f[2]},${j = f[3]}}`;
        b.push(i, i >> 8, j, j >> 8), e += (j << 1) + 2, y = 0;
        do c(h[y]); while (++y < h.length);
        b.push(0);
    } while (a[z] = RegExp(`^${g}$`), d += `\\t(${g})`, ++z < parts.length);
    (this.patterns_ = a).unshift(/^[0-9A-Za-z]{45}$/);
    this.id_ = fnv1a(this.raw_ = new Uint8Array(b));
    this.regex_ = RegExp(d + "$");
    this.view_ = new DataView((this.buffer_ = new Uint8Array(e)).buffer);
  }
  /** Gets keys, optionally omitting some parts. */
  keys_(omit: boolean[] = []) {
    let a: Key[] = ["key"], z = 0;
    do if (!omit[z]) a.push(this.parts[z][0]); while (++z < this.parts.length);
    return a;
  }
  /** Generates matching strings. */
  random_(count = 1) {
    const a = new Uint8Array(32);
    const c = Array<string>(count);
    for (let z = 0, y, x, w, d, e, f, g; z < count; ++z) {
      d = u_b62(crypto.getRandomValues(a)),
        crypto.getRandomValues(this.buffer_);
      y = x = 0;
      do switch ((d += "\t", e = this.parts[y])[1]) {
        case 0:
          d += this.buffer_[x++] & 1 ? "yes" : "no";
          break;
        case 1:
          d += this.buffer_[x++] % (e[3] - e[2]) + e[2];
          break;
        case 2:
          d += +(this.view_.getUint32(x) * Math.random()).toFixed(8), x += 8;
          break;
        case 3:
          d += e[2][this.view_.getUint16(x) % e[2].length | 0], x += 2;
          break;
        case 4:
          f = this.view_.getUint32(x), x += 4, g = "", w = 0;
          do if (f & 1 << w) g = `${e[2][w]}, ${g}`; while (++w < e[2].length);
          d += g.slice(0, -2);
          break;
        case 5:
          f = between(e[2], e[3]), w = 0;
          do d += String.fromCharCode(
            this.buffer_[x] % 26 + (this.buffer_[x++] > 127 ? 97 : 65),
          ); while (++w < f);
          break;
        case 6:
          f = between(e[2], e[3]), g = "", w = 0;
          do g += +(this.view_.getUint32(x) * Math.random()).toFixed(8)
            + ", "; while (x += 8, ++w < f);
          d += g.slice(0, -2);
          break;
        case 7:
          f = between(e[2], e[3]), g = "", w = 0;
          do g += e[4][this.view_.getUint16(x) % e[4].length | 0]
            + ", "; while (
            x += 2, ++w < f
          );
          d += g.slice(0, -2);
      } while (++y < this.parts.length);
      c[z] = d;
    }
    return c;
  }
  /** Converts a string to a data object. */
  parse_(path: string, seeds: U32, value: string) {
    const a = this.regex_.exec(value);
    if (!a) return no(path, this.regex_, value, "8968");
    let b = b62_u(a[1]), c, d, e, z = 0, y;
    const g: Data = { __proto__: null, $$: b, $: query(seeds, b) };
    do switch ((c = a[z + 2], d = this.parts[z])[1]) {
      case 0:
        g[d[0]] = c === "no" ? 0 : 1;
        break;
      case 1:
      case 2:
        g[d[0]] = +c;
        break;
      case 3:
        g[d[0]] = d[2].indexOf(c);
        break;
      case 4:
        c = c.split(", "), e = y = 0;
        do if (c[y]) e |= 1 << d[2].indexOf(c[y]); while (++y < c.length);
        g[d[0]] = e;
        break;
      case 5:
        g[`$${d[0]}`] = s_u(c);
        break;
      case 6:
        c = c.split(", "), e = [], y = 0;
        do if (c[y]) e.push(+c[y]); while (++y < c.length);
        g[`$${d[0]}`] = new Float64Array(e);
        break;
      case 7:
        c = c.split(", "), e = [], y = 0;
        do if (c[y]) e.push(d[4].indexOf(c[y])); while (++y < c.length);
        g[`$${d[0]}`] = new Uint16Array(e);
    } while (++z < this.parts.length);
    return g;
  }
  /** Converts a data object to a string, optionally omitting some parts. */
  stringify_(data: Data, seed = -1, omit: boolean[] = []) {
    let a = n32_b62(crc(data.$, seed)), b, c, d, e, z = 0, y;
    do if (!omit[z]) {
      switch ((a += "\t", b = this.parts[z])[1]) {
        case 0:
          a += data[b[0]] & 1 ? "yes" : "no";
          break;
        case 1:
        case 2:
          a += data[b[0]];
          break;
        case 3:
          a += b[2][data[b[0]]];
          break;
        case 4:
          c = data[b[0]], d = "";
          while (c) d += b[2][e = 31 - Math.clz32(c)] + ", ", c &= ~(1 << e);
          a += d.slice(0, -2);
          break;
        case 5:
          a += u_s(data[`$${b[0]}`]);
          break;
        case 6:
          c = data[`$${b[0]}`], d = "", y = 0;
          while (y < c.length) d += c[y++] + ", ";
          a += d.slice(0, -2);
          break;
        case 7:
          c = data[`$${b[0]}`], d = "", y = 0;
          while (y < c.length) d += b[4][c[y++]] + ", ";
          a += d.slice(0, -2);
      }
    } while (++z < this.parts.length);
    return a;
  }
}

import.meta.vitest?.describe("parser", async t => {
  const a = new Parser([
    ["boolean", 0],
    ["char", 1, 1, 100],
    ["number", 2],
    ["enum", 3, ["first", "second", "third", "fourth"]],
    ["bitset", 4, ["one", "two", "three", "four", "five", "six"]],
    ["string", 5, 1, 32],
    ["numbers", 6, 0, 3],
    ["enums", 7, 1, 4, ["apple", "banana", "cantaloupe", "date"]],
  ]);
  const { mph: set } = await import("../base/mph.ts");
  const Z = 0x100, b = a.random_(Z), c = Array<U8>(Z);
  for (let z = 0; z < Z; ++z) c[z] = b62_u(b[z].slice(0, 45));
  const d = set(c);
  t("raw", ({ expect }) => {
    const c = Parser.raw_("test", a.raw_);
    expect(c).not.toBeInstanceOf(Error);
    expect((<Parser> c).id_).toBe(a.id_);
  });
  t("random", ({ expect }) => {
    for (let z = 0; z < Z; ++z) expect(b[z]).toMatch(a.regex_);
  });
  t("parse stringify", async ({ expect }) => {
    for (let z = 0; z < Z; ++z) {
      const e = a.parse_("test", d, b[z]);
      expect(e).not.toBeInstanceOf(Error);
      if (!(e instanceof Error)) {
        expect(a.stringify_(e).slice(7)).toBe(b[z].slice(46));
      }
    }
  });
});
