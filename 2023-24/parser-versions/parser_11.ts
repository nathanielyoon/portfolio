import { b62_n16, b62_n32, b62_u, n16_b62, n32_b62, u_b62 } from "../base/62.ts";
import { b91_u, u_b91 } from "../base/91.ts";
import { fnv1a } from "../base/hash.ts";
import { get } from "../base/mph.ts";
import { no, s_u, test, u_s } from "../base/text.ts";
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
function push(this: number[], value: string) {
  let z = 0, a = s_u(value);
  this.push(a.length);
  do this.push(a[z]); while (++z < a.length);
}
const between = (min: number, max: number) =>
  min + Math.random() * Math.ceil((max - min) / 2);
export class Parser {
  static raw(raw: U8) {
    let a = new DataView(raw.buffer), b: Part[] = [], c, d, e, f, g, h, z = 0;
    while (z < raw.length) {
      c = test<Key>(
        "raw > key",
        /^[0-9A-Z]\w{0,254}$/i,
        u_s(raw.subarray(z + 4, z += a.getUint32(z, true) + 4)),
      );
      if (c instanceof Error) return c;
      switch (d = raw[z++]) {
        case 0:
        case 2:
          b.push([c, d]);
          break;
        case 1:
          b.push([c, d, raw[z++], raw[z++]]);
          break;
        case 5:
        case 6:
          b.push([c, d, a.getUint16(z, true), a.getUint16(z += 2, true)]);
          z += 2;
          break;
        case 3:
        case 4:
          e = [];
          while (f = raw[z++]) e.push(u_s(raw.subarray(z, z += f)));
          b.push([c, d, e]);
          break;
        case 7:
          e = a.getUint16(z, true), f = a.getUint16(z += 2, true), z += 2;
          g = [];
          while (h = raw[z++]) g.push(u_s(raw.subarray(z, z += h)));
          b.push([c, d, e, f, g]);
      }
    }
    return new Parser(b);
  }
  patterns;
  raw;
  id;
  regex;
  buffer;
  view;
  constructor(public parts: Part[]) {
    const a = Array<RegExp>(parts.length), b: number[] = [], c = push.bind(b);
    let d = "^(?=.{1,65535}$)([0-9A-Za-z]{45})", e = 0, f, g, h, z = 0, y;
    do switch ((c((f = parts[z])[0]), b.push(f[1]), f)[1]) {
      case 0:
        g = "(?:yes|no)", ++e;
        break;
      case 1:
        g = "(?:" + (y = f[2]), b.push(y, f[3]), ++e;
        while (++y <= f[3]) g += "|" + y;
        g += ")";
        break;
      case 2:
        g = "-?\\d+(?:\\.\\d+)?", e += 8;
        break;
      case 3:
        g = `(?:${escape(f = f[2])})`, e += 2, y = 0;
        do c(f[y]); while (++y < f.length);
        b.push(0);
        break;
      case 4:
        g = `(?:(?:${escape(f = f[2])})(?:, |(?=\\t|$))){0,${f.length}}`;
        e += 4, y = 0;
        do c(f[y]); while (++y < f.length);
        b.push(0);
        break;
      case 5:
        g = `[^\\n\\t]{${y = f[2]},${f = f[3]}}`, b.push(y, y >> 8, f, f >> 8);
        e += f + 2;
        break;
      case 6:
        g = `(?:-?\\d+(?:\\.\\d+)?(?:, |(?=\\t|$))){${y = f[2]},${f = f[3]}}`;
        b.push(y, y >> 8, f, f >> 8), e += (f << 3) + 2;
        break;
      case 7:
        g = `(?:(?:${escape(h = f[4])})(?:, |(?=\\t|$))){${y = f[2]},${f =
          f[3]}}`;
        b.push(y, y >> 8, f, f >> 8), e += (f << 1) + 2, y = 0;
        do c(h[y]); while (++y < h.length);
        b.push(0);
    } while (a[z] = RegExp(`^${g}$`), d += `\\t(${g})`, ++z < parts.length);
    this.patterns = a, this.id = fnv1a(this.raw = new Uint8Array(b));
    this.regex = RegExp(`^${d}$`);
    this.view = new DataView((this.buffer = new Uint8Array(e)).buffer);
  }
  random(count = 1) {
    const a = new Uint8Array(32);
    const c = Array<string>(count);
    for (let z = 0, y, x, w, d, e, f, g; z < count; ++z) {
      d = u_b62(crypto.getRandomValues(a)), crypto.getRandomValues(this.buffer);
      y = x = 0;
      do switch ((d += "\t", e = this.parts[y])[1]) {
        case 0:
          d += this.buffer[x++] & 1 ? "yes" : "no";
          break;
        case 1:
          d += this.buffer[x++] % (e[3] - e[2]) + e[2];
          break;
        case 2:
          d += +(this.view.getUint32(x) * Math.random()).toFixed(8), x += 8;
          break;
        case 3:
          d += e[2][this.view.getUint16(x) % e[2].length | 0], x += 2;
          break;
        case 4:
          f = this.view.getUint32(x), x += 4, g = "", w = 0;
          do if (f & 1 << w) g = `${e[2][w]}, ${g}`; while (++w < e[2].length);
          d += g.slice(0, -2);
          break;
        case 5:
          f = between(e[2], e[3]), w = 0;
          do d += String.fromCharCode(
            this.buffer[x] % 26 + (this.buffer[x++] > 127 ? 97 : 65),
          ); while (++w < f);
          break;
        case 6:
          f = between(e[2], e[3]), g = "", w = 0;
          do g += +(this.view.getUint32(x) * Math.random()).toFixed(8)
            + ", "; while (x += 8, ++w < f);
          d += g.slice(0, -2);
          break;
        case 7:
          f = between(e[2], e[3]), g = "", w = 0;
          do g += e[4][this.view.getUint16(x) % e[4].length | 0] + ", "; while (
            x += 2, ++w < f
          );
          d += g.slice(0, -2);
      } while (++y < this.parts.length);
      c[z] = d;
    }
    return c;
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
const b = Parser.raw(a.raw);
console.log(a.id);
console.log(b);

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
  const Z = 0xff, b = a.random(Z);
  t("random", ({ expect }) => {
    for (let z = 0; z < Z; ++z) expect(b[z]).toMatch(a.regex);
  });
});
