import { b32_n, b32_u32, n_b32, u32_b32 } from "../base/32.ts";
import { B91, b91_u, u_b91 } from "../base/91.ts";
import { hash } from "../base/hash.ts";
import { no, s_u, test, u_s } from "../base/text.ts";
import { chacha } from "../crypto/chacha.ts";
import { poly } from "../crypto/poly.ts";
import type { Data } from "./lambda.ts";

type Parts = (
  | [key: string, type: 0 | 1 | 2]
  | [key: string, type: 3, min: number, max: number]
  | [key: string, type: 4, min: number, max: number, options: string[]]
  | [key: string, type: 5 | 6, options: string[]]
)[];
export type Row = Record<string, string>;
const PART =
  /\(\?<(_?[A-Za-z]\w{1,253})>(?:(\[A-Z2-7\]\{52\})|(\\d\+)|(-\?\\d\+\(\?:\\\.\\d\+\)\?)|\[\^\\n\\t\\0\]\{(\d{1,5}),([1-9]\d{0,4})\}|\(\?:\(\?:([^|()]{1,255}?(?:\|[^|()]{1,255}){0,4294967294})\)\\\|\)\{(\d{1,5}),([1-9]\d{0,4})\}|\(\?:\(\?:([^|()]{1,255}?(?:\|[^|()]{1,255}){0,31})\)\\\|\)\*|([^|()]{1,255}?(?:\|[^|()]{1,255}){0,4294967295}))\)(?=\\t\(\?|\$$)/g;
const SOURCE = PART.source;
const PARTS = RegExp(`^\\/?\\^${SOURCE}(?:\\\\t${SOURCE}){0,254}\\$\\/?$`);
const split = (options: string) => {
  const a = options.split("|");
  for (let z = 0; z < a.length; ++z) a[z] = a[z].replace(/\\(.)/g, "$1");
  return a;
};
const join = (options: string[]) => {
  let Z = options.length, a = Array<string>(Z), z = 0;
  do a[z] = `"${options[z]}"`; while (++z < Z);
  return `[${a}]`;
};
function is_number(maybe: unknown): asserts maybe is number {
  typeof maybe === "number" || no("Number", maybe);
}
function is_string(maybe: unknown): asserts maybe is string {
  typeof maybe === "string" || no("String", maybe);
}
const anchor = (pattern: string) =>
  RegExp(`^(?=.{1,65535}$)${pattern.replace(/^\^|\$$/g, "")}$`);
const escape = (options: string[]) => {
  let a = "", z = 0, Z = options.length;
  do a += "|" + options[z].replace(/[$(-+./?[-^{|}]/g, "\\$&"); while (++z < Z);
  return a.slice(1);
};
const STRICT = "\"use strict\";\n";
export class Parser {
  static from_regex(pattern: string) {
    const a = [...test(PARTS, pattern).matchAll(PART)], Z = a.length;
    if (!Z) no(PART, pattern, "8968");
    let z = 0, y = 0, b = Array(Z), c, d, f;
    do b[z] = (d = (c = a[z])[1], f = +c[6])
      ? (y += Math.ceil(f / 4), [d, 3, +c[5], f])
      : (f = +c[9])
      ? (y += f, [d, 4, +c[8], f, split(c[7])])
      : c[2]
      ? (y += 8, [d, 0])
      : c[4]
      ? (y += 2, [d, 2])
      : (++y, c[3])
      ? [d, 1]
      : [d, (f = c[10]) ? 5 : (f = c[11], 6), split(f)]; while (++z < Z);
    return new Parser(anchor(pattern), y, b);
  }
  static from_json(json: string) {
    const a = JSON.parse(json);
    if (!Array.isArray(a)) return no("Array", a);
    const Z = a.length;
    if (!Z) return no("1+ parts", a);
    let z = 0, y = 0, x, c = "^", d, e, f, g, h;
    do if (Array.isArray(d = a[z])) {
      test(/^_?[A-Za-z]\w+$/, e = d[0]), c += `(?<${e}>`;
      switch (d[1]) {
        case 0:
          y += 8, c += "[A-Z2-7]{52}";
          break;
        case 1:
          ++y, c += "\\d+";
          break;
        case 2:
          y += 2, c += "-?\\d+(?:\\.\\d+)?";
          break;
        case 3:
          is_number(f = d[2]), is_number(g = d[3]), y += Math.ceil(g / 4);
          if (f > g) no(`Maximum >= minimum`, `${f},${g}`);
          c += `[^\\n\\t\\0]{${f},${g}}`;
          break;
        case 4:
          is_number(f = d[2]), is_number(g = d[3]), y += g, x = 0;
          Array.isArray(h = <[]> d[4]) || no("Array", h);
          h.length || no("1+ options", h);
          c += `(?:(?:${escape(h)})\\|){${f},${g}}`;
          do is_string(h[x]); while (++x < h.length);
          break;
        case 5:
          Array.isArray(f = <[]> d[2]) || no("Array", f), x = 0, ++y;
          f.length || no("1+ options", f), c += `(?:(?:${escape(f)})\\|)*`;
          do is_string(f[x]); while (++x < f.length);
          break;
        case 6:
          Array.isArray(f = <[]> d[2]) || no("Array", f), x = 0, ++y;
          f.length || no("1+ options", f), c += escape(f);
          do is_string(f[x]); while (++x < f.length);
          break;
        default:
          no("Type 0-6", d[1]);
      }
    } else return no("Array", d); while (c += ")\\t", ++z < Z);
    return new Parser(anchor(c.slice(0, -2)), y, <Parts> a);
  }
  static from_binary(bytes: U8) {
    if (bytes[0] || bytes[1]) no("Two zero bytes", `${bytes[0]},${bytes[1]}`);
    let a: Parts = [], b = "", c, d, e, f, z = 2, y = 0, x;
    do {
      b += `(?<${c = u_s(bytes.subarray(z + 1, z += bytes[z++] + 1))}>`;
      switch (d = bytes[z++]) {
        case 0:
          a.push([c, d]), b += "[A-Z2-7]{52}", y += 8;
          break;
        case 1:
          a.push([c, d]), b += "\\d+", ++y;
          break;
        case 2:
          a.push([c, d]), b += "-?\\d+(?:\\.\\d+)?", y += 2;
          break;
        case 3:
          d = bytes[z++] ?? no("Minimum", null);
          y += Math.ceil((e = bytes[z++] ?? no("Maximum", null)) / 4);
          a.push([c, 3, d, e]), b += `[^\\n\\t\\0]{${d},${e}}`;
          break;
        case 4:
          d = bytes[z++] ?? no("Minimum", null);
          y += e = bytes[z++] ?? no("Maximum", null), f = [];
          while (x = bytes[z++]) f.push(u_s(bytes.subarray(z, z += x)));
          if (!f.length) no("1+ options", f);
          a.push([c, 4, d, e, f]), b += `(?:(?:${escape(f)})\\|){${d},${e}}`;
          break;
        case 5:
          f = <string[]> [], ++y;
          while (x = bytes[z++]) f.push(u_s(bytes.subarray(z, z += x)));
          if (!f.length) no("1+ options", f);
          a.push([c, d, f]), b += `(?:(?:${escape(f)})\\|)*`;
          break;
          break;
        case 6:
          f = <string[]> [], ++y;
          while (x = bytes[z++]) f.push(u_s(bytes.subarray(z, z += x)));
          if (!f.length) no("1+ options", f);
          a.push([c, d, f]), b += escape(f);
          break;
        default:
          no("Type byte", bytes[z - 1]);
      }
    } while (b += ")\\t", z < bytes.length);
    return new Parser(anchor(b.slice(0, -2)), y, a);
  }
  base;
  random;
  s_d;
  d_s;
  d_c;
  c_d;
  c_r;
  r_c;
  constructor(public regex: RegExp, public size: number, public parts: Parts) {
    let z = 0, y = 4, x = 0, w = 0, a, b, c, d, e, f, g;
    const Z = parts.length;
    let base = STRICT + "const a={};";
    let random = STRICT + "const a={};";
    let s_d = STRICT
      + "const a=this.regex.exec(A)?.groups;if(!a)throw Error(`WANTED:\n${this.regex}\n\nGOT:\n${A}\n\nINFO:\nw.wiki/8968`);";
    let d_s = STRICT + "let a = \"\";";
    let d_c = `${STRICT}const a=new Uint32Array(${
      size + 4
    }),b=new DataView(a.buffer),c=new Uint32Array(B.buffer),d=new Uint32Array(C.buffer),e=new Uint32Array(16);this.chacha(c,0,d,e);const f=new Uint32Array(e);`;
    let c_d =
      `${STRICT}const a=new Uint32Array(A.buffer),b=new DataView(A.buffer),c={},d=new Uint32Array(B.buffer),e=new Uint32Array(C.buffer),f=new Uint32Array(16);this.chacha(d,0,e,f);let g=this.poly(new Uint8Array(f.buffer),A.subarray(16),D??new Uint8Array()),h=0,z=0;do h|=A[z]!==g[z];while(++z<16);if(h)return null;`;
    let c_r = STRICT
      + "const a=new Uint32Array(A.buffer),b=new DataView(A.buffer),c={};c.$p=this.u_b91(A.subarray(0,16));";
    let r_c = `${STRICT}const a=new Uint32Array(${
      size + 4
    }),b=new DataView(a.buffer),c=new Uint8Array(a.buffer);c.set(this.b91_u(A.$p));`;
    do {
      c = (b = (a = parts[z])[0])[0] === "_", d = y;
      switch (a[1]) {
        case 0:
          base += `a.${b}=new Uint32Array(8);`;
          random += `a.${b}=crypto.getRandomValues(new Uint32Array(8));`;
          s_d += `a.${b}=new Uint32Array(this.b32_u32(a.${b}).buffer);`;
          d_s += `a+=this.u32_b32(new Uint8Array(A.${b}.buffer))+"\t";`;
          d_c += `a.set(A.${b},${y});`;
          g = `c.${b}=new Uint32Array(a.subarray(${y},${y + 8}));`;
          c_r += `c.${b}=this.u${c ? "_b91" : "32_b32"}(A.subarray(${y * 4},${
            y * 4 + 32
          }));`;
          r_c += `c.set(this.b${c ? "91_u" : "32_u32"}(A.${b}),${y * 4});`;
          y += 8;
          break;
        case 1:
          base += `a.${b}=0;`;
          random += `a.${b}=Math.random()*0xffffffff>>>0;`;
          s_d += `a.${b}>>>=0;`;
          d_s += `a+=(A.${b}>>>0)+"\t";`;
          d_c += `a[${y}]=A.${b};`;
          g = `c.${b}=a[${y}];`;
          c_r += `c.${b}=${c ? `this.n_b32(a[${y}])` : `String(a[${y}])`};`;
          r_c += `a[${y}]=${c ? `this.b32_n(A.${b})` : `A.${b}>>>0`};`;
          ++y;
          break;
        case 2:
          base += `a.${b}=0;`;
          random += `a.${b}=Math.fround(Math.random()*0xffffff);`;
          s_d += `a.${b}=+a.${b}||0;`;
          d_s += `a+=(A.${b}||0)+"\t";`;
          d_c += `b.setFloat64(${y * 4},A.${b},true);`;
          g = `c.${b}=b.getFloat64(${y * 4},true);`;
          c_r += `c.${b}=${
            c
              ? `this.n_b32(a[${y}])+this.n_b32(a[${y + 1}]);`
              : `String(b.getFloat64(${y * 4},true));`
          };`;
          r_c += c
            ? `a[${y}]=this.b32_n(A.${b}),a[${
              y + 1
            }]=this.b32_n(A.${b}.slice(7));`
            : `b.setFloat64(${y * 4},A.${b},true);`;
          y += 2;
          break;
        case 3:
          e = Math.ceil(a[3] / 4);
          base += `a.${b}=new Uint32Array(${e}).fill(0x21212121);`;
          random += `let a${z}=crypto.getRandomValues(new Uint8Array(${
            a[3]
          })),z${z}=0;do a${z}[z${z}]=a${z}[z${z}]%94+33;while(++z${z}<${
            a[3]
          });new Uint8Array((a.${b}=new Uint32Array(${e})).buffer).set(a${z});`;
          s_d +=
            `let a${z}=new Uint32Array(${e});new TextEncoder().encodeInto(a.${b},new Uint8Array(a${z}.buffer));a.${b}=a${z};`;
          d_s +=
            `a+=new TextDecoder().decode(new Uint8Array(A.${b}.buffer)).replaceAll("\\0","")+"\t";`;
          d_c += `a.set(A.${b},${y});`;
          g = `c.${b}=new Uint32Array(a.subarray(${y},${y + e}));`;
          c_r += `c.${b}=${
            c ? `this.u_b91` : `new TextDecoder().decode`
          }(A.subarray(${y * 4},${(y + e) * 4}))${
            c ? "" : ".replaceAll(\"\\0\", \"\")"
          };`;
          r_c += `c.set(${
            c ? "this.b91_u" : "new TextEncoder().encode"
          }(A.${b}),${y * 4});`;
          y += e;
          break;
        case 4:
          e = a[3], f = join(a[4]);
          base += `a.${b}=new Uint32Array(${e}).fill(-1);`;
          random +=
            `let a${z}=crypto.getRandomValues(new Uint32Array(${e})),z${z}=0;do a${z}[z${z}]%=${
              a[4].length
            };while(++z${z}<${e});a.${b}=a${z};`;
          s_d +=
            `let a${z}=a.${b}.split("|"),b${z}=${f},c${z},d${z}=new Uint32Array(${e}).fill(-1),z${z}=0;do if(c${z}=a${z}[z${z}])d${z}[z${z}]=b${z}.indexOf(c${z});while(++z${z}<a${z}.length);a.${b}=d${z};`;
          d_s +=
            `let a${z}=A.${b},b${z}=${f},c${z},z${z}=0;do if(c${z}=b${z}[a${z}[z${z}]])a+=c${z}+"|";while(++z${z}<${e});a+="\t";`;
          d_c += `a.set(A.${b},${y});`;
          g = `c.${b}=new Uint32Array(a.subarray(${y},${y + e}));`;
          c_r += c
            ? `c.${b}=this.u_b91(A.subarray(${y * 4},${(y + e) * 4}));`
            : `let a${z}=${f},b${z},c${z}="",z${z}=0;do if(b${z}=a${z}[a[${y}+z${z}]])c${z}+=b${z}+"|";while(++z${z}<${e});c.${b}=c${z};`;
          r_c += c
            ? `c.set(this.b91_u(A.${b}),${y * 4});`
            : `let a${z}=A.${b}.split("|"),b${z}=${f},c${z},z${z}=0;do a[${y}+z${z}]=b${z}.indexOf(a${z}[z${z}]);while(++z${z}<${e});`;
          y += e;
          break;
        case 5:
          f = join(a[2]);
          base += `a.${b}=0;`;
          random += `a.${b}=Math.random()*${(1 << a[2].length) - 1}>>>0;`;
          s_d +=
            `let a${z}=a.${b}.split("|"),b${z}=${f},c${z},d${z}=0,z${z}=0;do if(c${z}=a${z}[z${z}])d${z}|=1<<b${z}.indexOf(c${z});while(++z${z}<a${z}.length);a.${b}=d${z};`;
          d_s +=
            `let a${z}=A.${b},b${z}=${f},c${z},d${z};do if(d${z}=b${z}[c${z}=31-Math.clz32(a${z})])a+=d${z}+"|";while(a${z}&=~(1<<c${z}));a+="\t";`;
          d_c += `a[${y}]=A.${b};`;
          g = `c.${b}=a[${y}];`;
          c_r += c
            ? `c.${b}=this.n_b32(a[${y}]);`
            : `let a${z}=a[${y}],b${z}=${f},c${z},d${z},e${z}="";do if(d${z}=b${z}[c${z}=31-Math.clz32(a${z})])e${z}+=d${z}+"|";while(a${z}&=~(1<<c${z}));c.${b}=e${z};`;
          r_c += c
            ? `a[${y}]=this.b32_n(A.${b});`
            : `let a${z}=A.${b}.split("|"),b${z}=${f},c${z},d${z}=0,z${z}=0;do if(c${z}=a${z}[z${z}])d${z}|=1<<b${z}.indexOf(c${z});while(++z${z}<a${z}.length);a[${y}]=d${z};`;
          ++y;
          break;
        case 6:
          f = join(a[2]);
          base += `a.${b}=0;`;
          random += `a.${b}=Math.random()*${a[2].length}>>>0;`;
          s_d += `a.${b}=${f}.indexOf(a.${b});`;
          d_s += `a+=${f}[A.${b}]+"\t";`;
          d_c += `a[${y}]=A.${b};`;
          g = `c.${b}=a[${y}];`;
          c_r += `c.${b}=${c ? `this.n_b32(a[${y}])` : `${f}[a[${y}]]`};`;
          r_c += `a[${y}]=${
            c ? `this.b32_n(A.${b})` : `${f}.indexOf(A.${b})`
          };`;
          ++y;
          break;
      }
      if (c) {
        do (e = x++ & 0xf)
          || (d_c += `this.chacha(c,${++w},d,e);`,
            c_d += `this.chacha(d,${w},e,f);`),
          d_c += `a[${d}]^=e[${e}];`,
          c_d += `a[${d}]^=f[${e}];`; while (++d < y);
      }
      c_d += g;
    } while (++z < Z);
    this.base = <() => Data> Function(base + "return a;");
    this.random = <() => Data> Function(random + "return a;");
    this.s_d = <(string: string) => Data> Function(
      "A",
      s_d + "return a;",
    ).bind({ regex, b32_u32 });
    this.d_s = <(data: Data) => string> Function(
      "A",
      d_s + "return a.slice(0,-1);",
    ).bind({ u32_b32 });
    this.d_c = <(data: Data, key: U8, iv: U8, additional?: U8) => U8> Function(
      "A,B,C,D",
      d_c
        + "const g=new Uint8Array(a.buffer);const h=this.poly(new Uint8Array(f.buffer),g.subarray(16),D??new Uint8Array());g.set(h);return g;",
    ).bind({ chacha, poly });
    this.c_d = <(
      ciphertext: U8,
      key: U8,
      iv: U8,
      additional?: U8,
    ) => Data> Function(
      "A,B,C,D",
      c_d + "return c;",
    ).bind({ chacha, poly });
    this.c_r = <(ciphertext: U8) => Row> Function(
      "A",
      c_r + "return c;",
    ).bind({ u32_b32, u_b91, n_b32 });
    this.r_c = <(row: Row) => U8> Function(
      "A",
      r_c + "return c;",
    ).bind({ b32_u32, b91_u, b32_n });
  }
  get id() {
    const a = s_u(this.regex.source);
    const b = new Uint32Array(Math.ceil(a.length / 4));
    return new Uint8Array(b.buffer).set(a), hash(b);
  }
  get binary() {
    let a, b, c, d = [0, 0], z = 0, y, Z = this.parts.length;
    do {
      d.push((b = s_u((a = this.parts[z])[0])).length, ...b, a[1]);
      switch (a[1]) {
        case 3:
          d.push(a[2], a[3]);
          break;
        case 4:
          d.push(a[2], a[3]), c = a[4], y = 0;
          do d.push((b = s_u(c[y])).length, ...b); while (++y < c.length);
          d.push(0);
          break;
        case 5:
        case 6:
          c = a[2], y = 0;
          do d.push((b = s_u(c[y])).length, ...b); while (++y < c.length);
          d.push(0);
      }
    } while (++z < Z);
    return new Uint8Array(d);
  }
  get keys() {
    let Z = this.parts.length, a = Array<string>(Z), z = 0;
    do a[z] = this.parts[z][0]; while (++z < Z);
    return a;
  }
  toJSON() {
    return this.parts;
  }
  toString() {
    return u_b91(this.binary);
  }
}

import.meta.vitest?.describe("parser", t => {
  const a =
    /^(?<key>[A-Z2-7]{52})\t(?<integer>\d+)\t(?<float>-?\d+(?:\.\d+)?)\t(?<string>[^\n\t\0]{1,32})\t(?<array>(?:(?:1|2|3)\|){1,3})\t(?<set>(?:(?:a|b|c)\|)*)\t(?<enum>A|B|C)\t(?<_key>[A-Z2-7]{52})\t(?<_integer>\d+)\t(?<_float>-?\d+(?:\.\d+)?)\t(?<_string>[^\n\t\0]{1,32})\t(?<_array>(?:(?:1|2|3)\|){1,3})\t(?<_set>(?:(?:a|b|c)\|)*)\t(?<_enum>A|B|C)$/
      .source;
  const b = JSON.stringify(
    [
      ["key", 0],
      ["integer", 1],
      ["float", 2],
      ["string", 3, 1, 32],
      ["array", 4, 1, 3, ["1", "2", "3"]],
      ["set", 5, ["a", "b", "c"]],
      ["enum", 6, ["A", "B", "C"]],
      ["_key", 0],
      ["_integer", 1],
      ["_float", 2],
      ["_string", 3, 1, 32],
      ["_array", 4, 1, 3, ["1", "2", "3"]],
      ["_set", 5, ["a", "b", "c"]],
      ["_enum", 6, ["A", "B", "C"]],
    ] satisfies Parts,
  );
  const c = b91_u(
    "!!uD`FA\",9_qbA3ctj@[sFFNV)f\"\"3N6>^[w3\"$~N,6K'%a+e!q#n<1Fv2%PhkMTw\"o#\\P|!)\"r8^qeo\\QH\"V8M~D!Oxtcft$~ea;eEaCGhV\\PofiiYdamsrHDS]VC_q/52!?%e(+6%RBUE~I\"H/X3MX$~HDA1gCe!t$,B]i\\?ea9eIa9#o#,Pt!g!!",
  );
  t("from regex", ({ expect }) => {
    expect(() => Parser.from_regex(a)).not.toThrow();
  });
  t("from json", ({ expect }) => {
    expect(() => Parser.from_json(b)).not.toThrow();
  });
  t("from binary", ({ expect }) => {
    expect(() => Parser.from_binary(c)).not.toThrow();
  });
  const d = Parser.from_regex(a);
  t("equal json", ({ expect }) => {
    const e = Parser.from_json(b);
    expect(e.regex.source).toBe(d.regex.source);
    expect(e.size).toBe(d.size);
    expect(e.parts).toEqual(d.parts);
    expect(e.id).toBe(d.id);
    expect(e.toString()).toBe(d.toString());
  });
  t("equal binary", ({ expect }) => {
    const e = Parser.from_binary(c);
    expect(e.regex.source).toBe(d.regex.source);
    expect(e.size).toBe(d.size);
    expect(e.parts).toEqual(d.parts);
    expect(e.id).toBe(d.id);
    expect(e.toString()).toBe(d.toString());
  });
  t("toJSON", ({ expect }) => {
    expect(Parser.from_json(JSON.stringify(d)).parts).toEqual(d.parts);
  });
  const Z = 1e3, e = Array<Data>(Z), f = Array<string>(Z);
  t("random", ({ expect }) => {
    let z = 0;
    do expect(f[z] = d.d_s(e[z] = d.random()))
      .toMatch(d.regex); while (++z < Z);
  });
  t("s_d d_s", ({ expect }) => {
    let z = 0;
    do expect(d.s_d(f[z])).toEqual(e[z]); while (++z < Z);
  });
  t("d_c c_d", ({ expect }) => {
    let z = 0, g, h, i, j, k;
    do {
      expect(d.c_d(
        k = d.d_c(
          g = e[z],
          h = crypto.getRandomValues(new Uint8Array(32)),
          i = crypto.getRandomValues(new Uint8Array(12)),
          j = crypto.getRandomValues(new Uint8Array(64)),
        ),
        h,
        i,
        j,
      )).toEqual(g);
      ++k[0], expect(d.c_d(k, h, i, j)).toBeNull();
      --k[0], ++h[0], expect(d.c_d(k, h, i, j)).toBeNull();
      --h[0], ++i[0], expect(d.c_d(k, h, i, j)).toBeNull();
      --i[0], ++j[0], expect(d.c_d(k, h, i, j)).toBeNull();
      expect(d.d_c(g, h, i, j).subarray(16)).not.toEqual(
        d.d_c(g, h, crypto.getRandomValues(new Uint8Array(12)), j).subarray(16),
      );
    } while (++z < Z);
  });
  t("c_r r_c", ({ expect }) => {
    let z = 0, g;
    do expect(d.r_c(d.c_r(
      g = d.d_c(
        e[z],
        crypto.getRandomValues(new Uint8Array(32)),
        crypto.getRandomValues(new Uint8Array(12)),
      ),
    ))).toEqual(g); while (++z < Z);
  });
});
