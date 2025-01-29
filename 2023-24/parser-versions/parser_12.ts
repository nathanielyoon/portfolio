import { b62_n16, b62_n32, b62_u, n16_b62, n32_b62, u_b62 } from "../base/62.ts";
import { b91_u, u_b91 } from "../base/91.ts";
import { get } from "../base/mph.ts";
import { no, s_u, u_s } from "../base/text.ts";
import { chacha } from "../crypto/chacha.ts";

export type Part = [
  Key,
  ...(
    | [type: 0 | 2]
    | [type: 3 | 4, options: string[]]
    | [type: 1 | 5 | 6, min: number, max: number]
    | [type: 7, min: number, max: number, options: string[]]
  ),
];
const escape = (options: string[]) => {
  let a = "", z = 0, Z = options.length || options.push("");
  do a += "|" + (/^[^\n\t,]{1,255}$/.exec(options[z])?.[0]
    .replace(/[$(-+./?[-^{|}]/g, "\\$&") ?? ""); while (++z < Z);
  return a.slice(1);
};
const between = (min: number, max: number) =>
  min + Math.random() * Math.ceil((max - min) / 2);
const is_array = (path: string, value: unknown) =>
  Array.isArray(value)
    ? <unknown[]> value
    : no([path, "parse parser"], "Array", value);
const is_number = (path: string, value: unknown, min: number, max: number) =>
  typeof value !== "number"
    ? no([path, "parse parser"], "Number", value)
    : value < min
    ? no([path, "parse parser"], `Min ${min}`, value)
    : value > max
    ? no([path, "parse parser"], `Max ${max}`, value)
    : value;
export class Parser {
  static json(path: string, json: string) {
    try {
      const a = is_array(path, JSON.parse(json));
      if (a instanceof Error) return a;
      if (!a.length) return no([path, "parse parser"], "1+ parts", a);
    } catch (a) {
      return a instanceof Error ? a : Error(String(a));
    }
  }
  patterns;
  regex;
  buffer;
  view;
  constructor(public parts: Part[]) {
    const a = Array<RegExp>(parts.length);
    let b = "^(?=.{1,65535}$)([0-9A-Za-z]{45})", c = 0, d, e, z = 0, y;
    do switch ((d = parts[z])[1]) {
      case 0:
        e = "(?:yes|no)", ++c;
        break;
      case 1:
        e = "(?:" + (y = d[2]), ++c;
        while (++y <= d[3]) e += "|" + y;
        e += ")";
        break;
      case 2:
        e = "-?\\d+(?:\\.\\d+)?", c += 8;
        break;
      case 3:
        e = `(?:${escape(d = d[2])})`, c += 2;
        break;
      case 4:
        e = `(?:(?:${escape(d[2])})(?:, |(?=\\t|$))){0,${d[2].length}}`;
        c += 4;
        break;
      case 5:
        e = `[^\\n\\t]{${d[2]},${d[3]}}`;
        c += d[3] + 2;
        break;
      case 6:
        e = `(?:-?\\d+(?:\\.\\d+)?(?:, |(?=\\t|$))){${d[2]},${d[3]}}`;
        c += (d[3] << 3) + 2;
        break;
      case 7:
        e = `(?:(?:${escape(d[4])})(?:, |(?=\\t|$))){${d[2]},${d[3]}}`;
        c += (d[3] << 1) + 2, y = 0;
    } while (a[z] = RegExp(`^${e}$`), b += `\\t(${e})`, ++z < parts.length);
    this.patterns = a, this.regex = RegExp(`^${b}$`);
    this.view = new DataView((this.buffer = new Uint8Array(c)).buffer);
  }
  toJSON() {
    return this.parts;
  }
  random(count = 1) {
    const a = new Uint8Array(32), b = Array<string>(count);
    for (let z = 0, y, x, w, c, d, e, f; z < count; ++z) {
      c = u_b62(crypto.getRandomValues(a)), crypto.getRandomValues(this.buffer);
      y = x = 0;
      do switch ((c += "\t", d = this.parts[y])[1]) {
        case 0:
          c += this.buffer[x++] & 1 ? "yes" : "no";
          break;
        case 1:
          c += this.buffer[x++] % (d[3] - d[2]) + d[2];
          break;
        case 2:
          c += +(this.view.getUint32(x) * Math.random()).toFixed(8), x += 8;
          break;
        case 3:
          c += d[2][this.view.getUint16(x) % d[2].length | 0], x += 2;
          break;
        case 4:
          e = this.view.getUint32(x), x += 4, f = "", w = 0;
          do if (e & 1 << w) f = `${d[2][w]}, ${f}`; while (++w < d[2].length);
          c += f.slice(0, -2);
          break;
        case 5:
          e = between(d[2], d[3]), w = 0;
          do c += String.fromCharCode(
            this.buffer[x] % 26 + (this.buffer[x++] > 127 ? 97 : 65),
          ); while (++w < e);
          break;
        case 6:
          e = between(d[2], d[3]), f = "", w = 0;
          do f += +(this.view.getUint32(x) * Math.random()).toFixed(8)
            + ", "; while (x += 8, ++w < e);
          c += f.slice(0, -2);
          break;
        case 7:
          e = between(d[2], d[3]), f = "", w = 0;
          do f += d[4][this.view.getUint16(x) % d[4].length | 0] + ", "; while (
            x += 2, ++w < e
          );
          c += f.slice(0, -2);
      } while (++y < this.parts.length);
      b[z] = c;
    }
    return b;
  }
  why(bad: string) {
    let a = bad.split("\t"), b = "", c = "", d = "", e, f, g, z = 0;
    do f = (c += e = a[z]).length,
      g = (d += (this.patterns[z].test(e) ? " " : "^").repeat(e.length)).length,
      (f > 80 || g > 80) && (b += `${c}\n${d}\n`, d = c = ""); while (
      ++z < this.patterns.length
    );
    return b;
  }
  parse(path: string, seeds: U32, string: string) {
    const a = this.regex.exec(string);
    if (!a) return no(path, this.regex, this.why(string), "8968");
    let b = b62_u(a[1]), c, d, e, f, z = 0, y = 2, x;
    const g: Data = { __proto__: null, $$: b, $: get(seeds, b) };
    do switch ((c = a[y], d = this.parts[z])[1]) {
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
        e = c.split(", "), f = x = 0;
        do if (e[x]) f |= 1 << d[2].indexOf(e[x]); while (++x < e.length);
        g[d[0]] = f;
        break;
      case 5:
        g[`$${d[0]}`] = s_u(c);
        break;
      case 6:
        e = c.split(", "), f = [], x = 0;
        do if (e[x]) f.push(+e[x]); while (++x < e.length);
        g[`$${d[0]}`] = new Float64Array(f);
        break;
      case 7:
        e = c.split(", "), f = [], x = 0;
        do if (e[x]) f.push(d[4].indexOf(e[x])); while (++x < e.length);
        g[`$${d[0]}`] = new Uint16Array(f);
    } while (++y, ++z < this.parts.length);
    return g;
  }
  encrypt(iv: U8, mask: boolean[], data: Data) {
    const a = new Uint32Array(data.$$.buffer), b = new Uint32Array(iv.buffer);
    const c = new Uint32Array(16), d = new Uint8Array(c.buffer);
    let e = n32_b62(data.$), f, g, h, i, z = 0, y = 0, x = 0, w;
    const l = (count: number) => {
      do (g = y & 0xf) || chacha(a, ++x, b, c),
        this.buffer[y++] ^= d[g]; while (--count);
    };
    do if (e += "\t", mask[z]) {
      switch ((f = this.parts[z])[1]) {
        case 0:
        case 1:
          (g = y++ & 0xf) || chacha(a, ++x, b, c);
          e += n16_b62(data[f[0]] ^ d[g]);
          break;
        case 2:
          this.view.setFloat64(y, data[f[0]], true);
          l(8);
          e += n32_b62(this.view.getUint32(y - 8, true))
            + n32_b62(this.view.getUint32(y - 4, true));
          break;
        case 3:
          this.view.setUint16(y, data[f[0]], true), l(2);
          e += n16_b62(this.view.getUint16(y - 2, true));
          break;
        case 4:
          this.view.setUint32(y, data[f[0]], true), l(4);
          e += n32_b62(this.view.getUint32(y - 4, true));
          break;
        case 5:
          this.view.setUint16(y, (h = data[`$${f[0]}`]).length, true), l(2);
          e += n16_b62(this.view.getUint16(y - 2, true));
          this.buffer.set(h, y), l(i = f[3]);
          e += u_b91(this.buffer.subarray(y - i, y));
          break;
        case 6:
          this.view.setUint16(y, (h = data[`$${f[0]}`]).length, true), l(2);
          e += n16_b62(this.view.getUint16(y - 2, true)), w = 0;
          do this.view.setFloat64(y, h[w], true),
            l(8),
            e += n32_b62(this.view.getUint32(y - 8, true))
              + n32_b62(this.view.getUint32(y - 4, true)); while (++w < f[3]);
          break;
        case 7:
          this.view.setUint16(y, (h = data[`$${f[0]}`]).length, true), l(2);
          e += n16_b62(this.view.getUint16(y - 2, true)), w = 0;
          do this.view.setUint16(y, h[w], true),
            l(2),
            e += n16_b62(this.view.getUint16(y - 2, true)); while (++w < f[3]);
      }
    } else {
      switch ((f = this.parts[z])[1]) {
        case 0:
          e += data[f[0]] & 1 ? "yes" : "no";
          break;
        case 1:
        case 2:
          e += data[f[0]];
          break;
        case 3:
          e += f[2][data[f[0]]];
          break;
        case 4:
          g = data[f[0]], h = "";
          while (g) h += f[2][i = 31 - Math.clz32(g)] + ", ", g &= ~(1 << i);
          e += h.slice(0, -2);
          break;
        case 5:
          e += u_s(data[`$${f[0]}`]);
          break;
        case 6:
          e += data[`$${f[0]}`].join(", ");
          break;
        case 7:
          g = data[`$${f[0]}`], h = "", w = 0;
          while (w < g.length) h += f[4][g[w++]] + ", ";
          e += h.slice(0, -2);
      }
    } while (++z < this.parts.length);
    return e;
  }
  decrypt(key: U8, iv: U8, mask: boolean[], data: string) {
    const a = new Uint32Array(key.buffer), b = new Uint32Array(iv.buffer);
    const c = new Uint32Array(16), d = new Uint8Array(c.buffer);
    let e = data.split("\t").slice(1), f, g, h, i, z = 0, y = 0, x = 0, w, v;
    const l = (count: number) => {
      do (g = y & 0xf) || chacha(a, ++x, b, c),
        this.buffer[y++] ^= d[g]; while (--count);
    };
    do if (mask[z]) {
      switch ((f = this.parts[z])[1]) {
        case 0:
          (g = y++ & 0xf) || chacha(a, ++x, b, c);
          e[z] = (b62_n16(e[z]) ^ d[g]) & 1 ? "yes" : "no";
          break;
        case 1:
          (g = y++ & 0xf) || chacha(a, ++x, b, c);
          e[z] = String(b62_n16(e[z]) ^ d[g]);
          break;
        case 2:
          this.view.setUint32(y, b62_n32(e[z]), true);
          this.view.setUint32(y + 4, b62_n32(e[z], 6), true), l(8);
          e[z] = String(this.view.getFloat64(y - 8, true));
          break;
        case 3:
          this.view.setUint16(y, b62_n16(e[z]), true), l(2);
          e[z] = f[2][this.view.getUint16(y - 2, true)];
          break;
        case 4:
          this.view.setUint32(y, b62_n32(e[z]), true), l(4);
          g = this.view.getUint32(y - 4, true), h = "";
          while (g) h += f[2][i = 31 - Math.clz32(g)] + ", ", g &= ~(1 << i);
          e[z] = h.slice(0, -2);
          break;
        case 5:
          this.view.setUint16(y, b62_n16(e[z]), true), l(2);
          h = this.view.getUint16(y - 2, true);
          this.buffer.set(b91_u(e[z].slice(3)), y), l(i = f[3]);
          e[z] = u_s(this.buffer.subarray(i = y - i, i + h));
          break;
        case 6:
          this.view.setUint16(y, b62_n16(e[z]), true), l(2);
          h = this.view.getUint16(y - 2, true), i = "", w = 0, v = -3;
          do this.view.setUint32(y, b62_n32(e[z], v += 6), true),
            this.view.setUint32(y + 4, b62_n32(e[z], v += 6), true),
            l(8),
            w < h && (i += this.view.getFloat64(y - 8, true) + ", "); while (
            ++w < f[3]
          );
          e[z] = i.slice(0, -2);
          break;
        case 7:
          this.view.setUint16(y, b62_n16(e[z]), true), l(2);
          h = this.view.getUint16(y - 2, true), i = "", w = 0, v = 0;
          do this.view.setUint16(y, b62_n16(e[z], v += 3), true),
            l(2),
            w < h
            && (i += f[4][this.view.getUint16(y - 2, true)] + ", "); while (
            ++w < f[3]
          );
          e[z] = i.slice(0, -2);
      }
    } while (++z < this.parts.length);
    return u_b62(key) + "\t" + e.join("\t");
  }
}

import.meta.vitest?.describe("parser", t => {
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
  const Z = 0x100, b = a.random(Z), c = Array<Data>(Z);
  t("random", ({ expect }) => {
    for (let z = 0; z < Z; ++z) expect(b[z]).toMatch(a.regex);
  });
  t("parse", async ({ expect }) => {
    const { set } = await import("../base/mph.ts");
    const d = set("test", b)[1], e = new Set<number>();
    for (let z = 0; z < Z; ++z) {
      const f = a.parse("test", d, b[z]);
      expect(f).not.toBeInstanceOf(Error);
      if (!(f instanceof Error)) c[z] = f, e.add(f.$);
    }
    expect([...e].sort()).toEqual([...Array(Z).keys()].sort());
  });
  t("encrypt decrypt", ({ expect }) => {
    for (let z = 0; z < 0x10; ++z) {
      const d = crypto.getRandomValues(new Uint8Array(12));
      const e = Array.from(Array(a.parts.length), () => Math.random() > 0.5);
      for (let y = 0; y < Z; ++y) {
        const f = a.encrypt(d, e, c[z]);
        const g = b[z].split("\t").slice(1), h = f.split("\t").slice(1);
        for (let x = 0; x < g.length; ++x) {
          e[x] ? expect(g[x]).not.toBe(h[x]) : expect(g[x]).toBe(h[x]);
        }
        expect(a.decrypt(c[z].$$, d, e, f)).toBe(b[z]);
      }
    }
  });
});
