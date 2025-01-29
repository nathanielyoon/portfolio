import { b16_u, u_b16 } from "../base/16.ts";
import { b91_u, u_b91 } from "../base/91.ts";
import { hash } from "../base/hash.ts";
import { no, s_u, test, u_s } from "../base/text.ts";
import { chacha } from "../crypto/chacha.ts";
import { poly } from "../crypto/poly.ts";
import type { Data, Key } from "./lambda.ts";

export type Part =
  | [Key, type: 0 | 1 | 2]
  | [Key, type: 3 | 4, options: string[]]
  | [Key, type: 5 | 6 | 7, min: number, max: number];
const escape = (options: string[]) => {
  let a = "", z = 0, Z = options.length;
  do a += "|" + test(/^[^|]{1,255}$/, options[z])
    .replace(/[$(-+./?[-^{|}]/g, "\\$&"); while (++z < Z);
  return a.slice(1);
};
const KEY = /^(?:[A-Za-z]\w{0,254}|\$)$/;
export class Parser {
  static raw(raw: U8) {
    let a: Part[] = [], b, c, d, e, f, z = 0, y = 0, Z = raw.length;
    do {
      b = raw[z++], c = test<Key>(KEY, u_s(raw.subarray(z, z += b)));
      switch (d = raw[z++]) {
        case 0:
        case 1:
        case 2:
          a[y] = [c, d];
          break;
        case 3:
        case 4:
          e = <string[]> [];
          while (f = raw[z++]) e.push(u_s(raw.subarray(z, z += f)));
          a[y] = [c, d, e];
          break;
        case 5:
        case 6:
        case 7:
          a[y] = [c, d, raw[z++] | raw[z++] << 8, raw[z++] | raw[z++] << 8];
      }
    } while (++y, z < Z);
    return new Parser(a.length ? a : no("1+ parts", a));
  }
  static json(json: Json) {
    if (!Array.isArray(json) || !json.length) return no("Array", json);
    let a, b, c, d, z = 0, y, Z = json.length, Y;
    do {
      if (!Array.isArray(a = json[z])) return no("Array", a);
      test<Key>(KEY, a[0]);
      switch (a[1]) {
        case 0:
        case 1:
        case 2:
          if (a.length > 2) no("2 elements", a);
          break;
        case 3:
        case 4:
          if (a.length > 3) no("3 elements", a);
          if (!Array.isArray(b = a[2]) || !b.length) return no("Array", b);
          y = 0, Y = b.length;
          do if (typeof b[y] !== "string") no("String", b[y]); while (++y < Y);
          break;
        case 5:
        case 6:
          if (a.length > 4) return no("4 elements", a);
          if (typeof (c = a[2]) !== "number") return no("Number", c);
          if (typeof (d = a[3]) !== "number") return no("Number", d);
          if (c > d) return no("Maximum >= minimum", `${c},${d}`);
      }
    } while (++z < Z);
    return new Parser(<Part[]> json);
  }
  static xor(key: U32, iv: U32, data: U8, mask: U8) {
    const a = new Uint32Array(16), b = new Uint8Array(a.buffer);
    let Z = data.length, c = new Uint8Array(Z), z = 0, y = 0, Y = Z - Z % 64, x;
    while (z < Y) {
      x = 0, chacha(key, ++y, iv, a);
      do c[z] = data[z] ^ b[x] & mask[z]; while (++z, ++x < 64);
    }
    if (Y < Z) {
      x = 0, chacha(key, ++y, iv, a);
      do c[z] = data[z] ^ b[x] & mask[z]; while (++x, ++z < Z);
    }
    return c;
  }
  regex;
  size;
  constructor(public parts: Part[]) {
    let a = "^(?=.{1,65535}$)", b = 0, c, d, z = 0, y, Z = parts.length, Y;
    do switch ((a += `(?<${(c = parts[z])[0]}>`, c)[1]) {
      case 0:
        a += "0|1", ++b;
        break;
      case 1:
        a += "\\d+", b += 4;
        break;
      case 2:
        a += "-?\\d+(?:\\.\\d+)?", b += 8;
        break;
      case 3:
        a += escape(d = c[2]), b += 2;
        (Y = d.length) > 65535 && no("Maximum 65535 options", Y);
        Y || no("Minimum 1 option", Y);
        break;
      case 4:
        a += `(?:(?:${escape(d = c[2])})\\|)*`, b += 4;
        (Y = d.length) > 32 && no("Maximum 32 options", Y);
        Y || no("Minimum 1 option", Y), y = 0;
        do d[y].includes("|") && no("No \"|\"", d[y]); while (++y < Y);
        break;
      case 5:
        a += `(?:\\d+(?:,|(?=\\t|$))){${c[2]},${Y = c[3]}}`, b += (Y << 2) + 2;
        Y > 65535 && no("Maximum 65535 maximum", Y);
        Y || no("Minimum 1 maximum", Y);
        break;
      case 6:
        a += `(?:-?\\d+(?:\\.\\d+(?:e[+-]\\d+)?)?(?:,|(?=\\t|$))){${c[2]},${Y =
          c[3]}}`, b += (Y << 3) + 2;
        Y > 65535 && no("Maximum 65535 maximum", Y);
        Y || no("Minimum 1 maximum", Y);
        break;
      case 7:
        a += `[^\\n\\t\\0]{${c[2]},${Y = c[3]}}`, b += Y + 2;
        Y > 65535 && no("Maximum 65535 maximum", Y);
        Y || no("Minimum 1 maximum", Y);
    } while (a += ")\\t", ++z < Z);
    this.regex = RegExp(a.slice(0, -2) + "$"), this.size = b;
  }
  get id() {
    const a = s_u(this.regex.source);
    const b = new Uint32Array(Math.ceil(a.length / 4));
    return new Uint8Array(b.buffer).set(a), hash(b);
  }
  get raw() {
    let a: number[] = [], b, c, d, e, z = 0, y, Z = this.parts.length, Y;
    do {
      a.push((c = s_u((b = this.parts[z])[0])).length, ...c, b[1]);
      switch (b[1]) {
        case 3:
        case 4:
          Y = (d = b[2]).length, y = 0;
          do a.push((c = s_u(d[y])).length, ...c); while (++y < Y);
          a.push(0);
          break;
        case 5:
        case 6:
        case 7:
          a.push(e = b[2], e >> 8, e = b[3], e >> 8);
          break;
      }
    } while (++z < Z);
    return new Uint8Array(a);
  }
  get keys() {
    let Z = this.parts.length, a = Array<Key>(Z), z = 0;
    do a[z] = this.parts[z][0]; while (++z < Z);
    return a;
  }
  toJSON() {
    return this.parts;
  }
  toString() {
    return u_b91(this.raw);
  }
  mask(encrypt: boolean[]) {
    let a = new Uint8Array(this.size), b, z = 0, y = 0, Z = this.parts.length;
    do switch ((b = this.parts[z])[1]) {
      case 0:
        encrypt[z] ? a[y++] = -1 : ++y;
        break;
      case 1:
      case 4:
        encrypt[z] ? a.subarray(y, y += 4).fill(-1) : y += 4;
        break;
      case 2:
        encrypt[z] ? a.subarray(y, y += 8).fill(-1) : y += 8;
        break;
      case 3:
        encrypt[z] ? a[y++] = a[y++] = -1 : y += 2;
        break;
      case 5:
        encrypt[z]
          ? a.subarray(y, y += (b[3] << 2) + 2).fill(-1)
          : y += (b[3] << 2) + 2;
        break;
      case 6:
        encrypt[z]
          ? a.subarray(y, y += (b[3] << 3) + 2).fill(-1)
          : y += (b[3] << 3) + 2;
        break;
      case 7:
        encrypt[z] ? a.subarray(y, y += b[3] + 2).fill(-1) : y += b[3] + 2;
    } while (++z < Z);
    return a;
  }
  random() {
    let a = <Data> {}, b, c, z = 0, y, Z = this.parts.length, Y;
    do switch ((b = this.parts[z])[1]) {
      case 0:
        a[b[0]] = Math.random() * 2 | 0;
        break;
      case 1:
        a[b[0]] = Math.random() * 0xffffffff >>> 0;
        break;
      case 2:
        a[b[0]] = +(Math.random() * 0xffffff).toFixed(2);
        break;
      case 3:
        a[b[0]] = Math.random() * b[2].length >>> 0;
        break;
      case 4:
        a[b[0]] = Math.random() * (1 << b[2].length - 1) >>> 0;
        break;
      case 5:
        a[`$${b[0]}`] = crypto.getRandomValues(new Uint32Array(b[3]));
        break;
      case 6:
        c = new Float64Array(crypto.getRandomValues(new Int32Array(Y = b[3])));
        a[`$${b[y = 0]}`] = c;
        do c[y] ||= 0; while (++y < Y);
        break;
      case 7:
        c = crypto.getRandomValues(new Uint8Array(Y = b[3])), y = 0;
        do c[y] = c[y] % 94 + 33; while (++y < Y);
        a[`$${b[0]}`] = c;
    } while (++z < Z);
    return a;
  }
  s_d(A: string) {
    const a = this.regex.exec(A) ?? no(this.regex, A, "8968"), b = <Data> {};
    let c, d, e, f, g, z = 0, y, Z = this.parts.length, Y;
    do switch ((c = this.parts[z])[1]) {
      case 0:
      case 2:
        b[c[0]] = +a[++z];
        break;
      case 1:
        b[c[0]] = +a[++z] >>> 0;
        break;
      case 3:
        b[c[0]] = c[2].indexOf(a[++z]);
        break;
      case 4:
        Y = (d = a[++z].split("|")).length, e = c[2], y = f = 0;
        do if (d[y]) f |= 1 << e.indexOf(d[y]); while (++y < Y);
        b[c[0]] = f;
        break;
      case 5:
        Y = (d = a[++z].split(",")).length, g = new Uint32Array(Y), y = 0;
        do g[y] = +d[y]; while (++y < Y);
        b[`$${c[0]}`] = g;
        break;
      case 6:
        Y = (d = a[++z].split(",")).length, g = new Float64Array(Y), y = 0;
        do g[y] = +d[y]; while (++y < Y);
        b[`$${c[0]}`] = g;
        break;
      case 7:
        b[`$${c[0]}`] = s_u(a[++z]);
    } while (z < Z);
    return b;
  }
  d_s(A: Data) {
    let a = "", b, c, d, e, z = 0, Z = this.parts.length;
    do switch ((b = this.parts[z])[1]) {
      case 0:
        a += A[b[0]] ? "1" : "0";
        break;
      case 1:
        a += A[b[0]] >>> 0;
        break;
      case 2:
        a += A[b[0]];
        break;
      case 3:
        a += b[2][A[b[0]]];
        break;
      case 4:
        c = A[b[0]], d = b[2];
        while (c) a += d[e = 31 - Math.clz32(c)] + "|", c &= ~(1 << e);
        break;
      case 5:
      case 6:
        a += A[`$${b[0]}`].join();
        break;
      case 7:
        a += u_s(<U8> A[`$${b[0]}`]);
    } while (a += "\t", ++z < Z);
    return a.slice(0, -1);
  }
  d_u(A: Data) {
    const a = new Uint8Array(this.size), b = a.buffer, c = new DataView(b);
    let d, e, z = 0, y = 0, x, Z = this.parts.length, Y;
    do switch ((d = this.parts[z])[1]) {
      case 0:
        a[y++] = A[d[0]] & 1;
        break;
      case 1:
      case 4:
        c.setUint32(y, A[d[0]], true), y += 4;
        break;
      case 2:
        c.setFloat64(y, A[d[0]], true), y += 8;
        break;
      case 3:
        c.setUint16(y, A[d[0]], true), y += 2;
        break;
      case 5:
        c.setUint16(y, Y = (e = A[`$${d[x = 0]}`]).length, true), y += 2;
        do c.setUint32(y, e[x], true); while (y += 4, ++x < Y);
        y += d[3] - Y << 2;
        break;
      case 6:
        c.setUint16(y, Y = (e = A[`$${d[x = 0]}`]).length, true), y += 2;
        do c.setFloat64(y, e[x], true); while (y += 8, ++x < Y);
        y += d[3] - Y << 3;
        break;
      case 7:
        c.setUint16(y, Y = (e = A[`$${d[0]}`]).length, true), y += 2;
        a.set(e, y), y += e.length, y += d[3] - Y;
    } while (++z < Z);
    return a;
  }
  u_d(A: U8) {
    const a = <Data> {}, b = A.buffer, c = new DataView(b);
    let d, e, z = 0, y = 0, x, Z = this.parts.length, Y;
    do switch ((d = this.parts[z])[1]) {
      case 0:
        a[d[0]] = A[y++] & 1;
        break;
      case 1:
      case 4:
        a[d[0]] = c.getUint32(y, true), y += 4;
        break;
      case 2:
        a[d[0]] = c.getFloat64(y, true), y += 8;
        break;
      case 3:
        a[d[0]] = c.getUint16(y, true), y += 2;
        break;
      case 5:
        e = new Uint32Array(Y = c.getUint16(y, true)), y += 2, x = 0;
        do e[x] = c.getUint32(y, true); while (y += 4, ++x < Y);
        a[`$${d[0]}`] = e, y += d[3] - Y << 2;
        break;
      case 6:
        e = new Float64Array(Y = c.getUint16(y, true)), y += 2, x = 0;
        do e[x] = c.getFloat64(y, true); while (y += 8, ++x < Y);
        a[`$${d[0]}`] = e, y += d[3] - Y << 3;
        break;
      case 7:
        Y = c.getUint16(y, true), y += 2;
        a[`$${d[0]}`] = new Uint8Array(A.subarray(y, y += Y)), y += d[3] - Y;
    } while (++z < Z);
    return a;
  }
  u_c(key: U8, iv: U8, plaintext: U8, mask: U8) {
    const a = new Uint32Array(key.buffer), b = new Uint32Array(iv.buffer);
    const c = new Uint32Array(16), d = Parser.xor(a, b, plaintext, mask);
    const e = new Uint8Array(plaintext.length + 16);
    chacha(a, 0, b, c), e.set(poly(new Uint8Array(c.buffer), d, mask));
    return e.set(d, 16), e;
  }
  c_u(key: U8, iv: U8, ciphertext: U8, mask: U8) {
    const a = new Uint32Array(key.buffer), b = new Uint32Array(iv.buffer);
    let c = new Uint32Array(16), d = ciphertext.subarray(16), e = 1, z = 0;
    chacha(a, 0, b, c);
    const f = poly(new Uint8Array(c.buffer), d, mask);
    do e &= ciphertext[z] === f[z] ? 1 : 0; while (++z < 16);
    return e ? Parser.xor(a, b, d, mask) : null;
  }
  c_s(ciphertext: U8, encrypt: boolean[]) {
    const a = new DataView(ciphertext.buffer), Z = this.parts.length;
    let b = u_b91(ciphertext.subarray(0, 16)), c, d, e, f, z = 0, y = 16, x, Y;
    do switch ((b += "\t", c = this.parts[z])[1]) {
      case 0:
        b += encrypt[z]
          ? ciphertext[y++].toString(16).padStart(2, "0")
          : ciphertext[y++] & 1;
        break;
      case 1:
        b += encrypt[z]
          ? a.getUint32(y, true).toString(16).padStart(8, "0")
          : a.getUint32(y, true);
        y += 4;
        break;
      case 2:
        b += encrypt[z]
          ? a.getUint32(y, true).toString(16).padStart(8, "0")
            + a.getUint32(y + 4, true).toString(16).padStart(8, "0")
          : a.getFloat64(y, true);
        y += 8;
        break;
      case 3:
        b += encrypt[z]
          ? a.getUint16(y, true).toString(16).padStart(4, "0")
          : c[2][a.getUint16(y, true)];
        y += 2;
        break;
      case 4:
        if (encrypt[z]) b += a.getUint32(y, true).toString(16).padStart(8, "0");
        else if (d = c[2], e = a.getUint32(y, true)) {
          do b += d[f = 31 - Math.clz32(e)] + "|"; while (e &= ~(1 << f));
          b = b.slice(0, -1);
        }
        y += 4;
        break;
      case 5:
        if (encrypt[z]) {
          b += a.getUint16(y, true).toString(16).padStart(4, "0"), y += 2;
          Y = c[3], x = 0;
          do b += a.getUint32(y, true)
            .toString(16).padStart(8, "0"); while (y += 4, ++x < Y);
        } else {
          Y = a.getUint16(y, true), y += 2, x = 0;
          while (x < Y) b += a.getUint32(y, true) + ",", ++x, y += 4;
          if (Y) b = b.slice(0, -1);
          y += c[3] - Y << 2;
        }
        break;
      case 6:
        if (encrypt[z]) {
          b += a.getUint16(y, true).toString(16).padStart(4, "0"), y += 2;
          Y = c[3], x = 0;
          do b += a.getUint32(y, true).toString(16).padStart(8, "0")
            + a.getUint32(y + 4, true).toString(16).padStart(8, "0"); while (
            y += 8, ++x < Y
          );
        } else {
          Y = a.getUint16(y, true), y += 2, x = 0;
          while (x < Y) b += a.getFloat64(y, true) + ",", ++x, y += 8;
          if (Y) b = b.slice(0, -1);
          y += c[3] - Y << 3;
        }
        break;
      case 7:
        if (encrypt[z]) {
          b += a.getUint16(y, true).toString(16).padStart(4, "0"), y += 2;
          b += u_b16(ciphertext.subarray(y, y += c[3]));
        } else {
          Y = a.getUint16(y, true), y += 2;
          b += u_s(ciphertext.subarray(y, y += Y)), y += c[3] - Y;
        }
    } while (++z < Z);
    return b;
  }
  s_c(string: string, encrypt: boolean[]) {
    const a = string.split("\t"), b = new Uint8Array(this.size + 16);
    const c = new DataView(b.buffer), Z = this.parts.length;
    let d, e, f, g, h, z = 0, y = 16, Y, x, w;
    do switch ((d = a[z + 1], e = this.parts[z])[1]) {
      case 0:
        b[y++] = encrypt[z] ? parseInt(d, 16) : +d & 1;
        break;
      case 1:
        c.setUint32(y, encrypt[z] ? parseInt(d, 16) : +d, true), y += 4;
        break;
      case 2:
        encrypt[z]
          ? (c.setUint32(y, parseInt(d.slice(0, 8), 16), true),
            c.setUint32(y + 4, parseInt(d.slice(8), 16), true))
          : c.setFloat64(y, +d, true);
        y += 8;
        break;
      case 3:
        c.setUint16(y, encrypt[z] ? parseInt(d, 16) : e[2].indexOf(d), true);
        y += 2;
        break;
      case 4:
        if (encrypt[z]) c.setUint32(y, parseInt(d, 16), true);
        else {
          Y = (f = d.split("|")).length, g = e[2], h = x = 0;
          do if (f[x]) h |= 1 << g.indexOf(f[x]); while (++x < Y);
          c.setUint32(y, h, true);
        }
        y += 4;
        break;
      case 5:
        if (encrypt[z]) {
          c.setUint16(y, parseInt(d.slice(x = 0, w = 4), 16), true), y += 2;
          Y = e[3];
          do c.setUint32(y, parseInt(d.slice(w, w += 8), 16), true); while (
            y += 4, ++x < Y
          );
        } else {
          c.setUint16(y, Y = (f = d.split(",")).length, true), y += 2, x = 0;
          do c.setUint32(y, +f[x], true); while (y += 4, ++x < Y);
          y += e[3] - Y << 2;
        }
        break;
      case 6:
        if (encrypt[z]) {
          c.setUint16(y, parseInt(d.slice(x = 0, w = 4), 16), true), y += 2;
          Y = e[3];
          do c.setUint32(y, parseInt(d.slice(w, w += 8), 16), true),
            c.setUint32(y + 4, parseInt(d.slice(w, w += 8), 16), true); while (
            y += 8, ++x < Y
          );
        } else {
          c.setUint16(y, Y = (f = d.split(",")).length, true), y += 2, x = 0;
          do c.setFloat64(y, +f[x], true); while (y += 8, ++x < Y);
          y += e[3] - Y << 3;
        }
        break;
      case 7:
        if (encrypt[z]) {
          c.setUint16(y, parseInt(d.slice(0, 4), 16), true);
          b.set(b16_u(d.slice(4)), y += 2);
        } else {
          c.setUint16(y, (f = s_u(d)).length, true), b.set(f, y += 2);
        }
        y += e[3];
    } while (++z < Z);
    return b.set(b91_u(a[0])), b;
  }
}

import.meta.vitest?.describe("parser", t => {
  const a = new Parser([
    ["boolean", 0],
    ["uint32", 1],
    ["float64", 2],
    ["enum", 3, ["A", "B", "C", "D", "E"]],
    ["bitset", 4, ["0", "1", "2", "3", "4", "5", "6", "7"]],
    ["uint32array", 5, 1, 8],
    ["float64array", 6, 0, 3],
    ["string", 7, 1, 32],
  ]);
  t("keys", ({ expect }) => {
    expect(a.keys).toEqual([
      "boolean",
      "uint32",
      "float64",
      "enum",
      "bitset",
      "uint32array",
      "float64array",
      "string",
    ]);
  });
  t("binary", ({ expect }) => {
    expect(Parser.raw(a.raw).id).toBe(a.id);
    expect(Parser.raw(b91_u(a.toString())).id).toBe(a.id);
  });
  t("json", ({ expect }) => {
    expect(Parser.json(JSON.parse(JSON.stringify(a))).id).toBe(a.id);
  });
  const Z = 1e3, b = Array<Data>(Z), c = Array<string>(Z), d = Array<U8>(Z);
  t("random", ({ expect }) => {
    let z = 0, e = a.regex;
    do expect(c[z] = a.d_s(b[z] = a.random())).toMatch(e); while (++z < Z);
  });
  t("s_d d_s", ({ expect }) => {
    let z = 0;
    do expect(a.s_d(c[z])).toEqual(b[z]); while (++z < Z);
  });
  t("d_u u_d", ({ expect }) => {
    let z = 0;
    do expect(a.u_d(d[z] = a.d_u(b[z]))).toEqual(b[z]); while (++z < Z);
  });
  t("d_c c_d", ({ expect }) => {
    let z = 0;
    do {
      const e = crypto.getRandomValues(new Uint8Array(32));
      const f = crypto.getRandomValues(new Uint8Array(12));
      const g = [true, true, true, true, true, true, true, true];
      const h = [true, false, true, false, true, false, true, false];
      const i = [false, true, false, true, false, true, false, true];
      for (const j of [g, h, i]) {
        const k = a.u_c(e, f, d[z], a.mask(j));
        expect(k.subarray(16)).not.toEqual(d[z]);
        expect(a.c_u(e, f, k, a.mask(j))).toEqual(d[z]);
        expect(a.s_c(a.c_s(k, j), j)).toEqual(k);
      }
      const k = a.u_c(e, f, d[z], new Uint8Array(0));
      expect(k.subarray(16)).toEqual(d[z]);
      expect(a.c_u(e, f, k, new Uint8Array(0))).toEqual(d[z]);
    } while (++z < Z);
  });
});
