import { ENCODER, s_u, test, u_s } from "../base/text.ts";

type U = // deno-fmt-ignore
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type Key = `${U | Lowercase<U>}${string}`;
export type Part = [
  Key,
  ...(
    | [type: 0 | 2]
    | [type: 1 | 5 | 6, min: number, max: number]
    | [type: 3 | 4, options: string[]]
    | [type: 7, min: number, max: number, options: string[]]
  ),
];
export const encode = (part: Part) => {
  const a = s_u(part[0]).subarray(0, 255), b = part[1], c = [a.length, ...a, b];
  let z, d, e;
  switch (b) {
    case 1:
      c.push(
        part[2],
        part[2] >> 8,
        part[2] >> 16,
        part[2] >> 24,
        part[3],
        part[3] >> 8,
        part[3] >> 16,
        part[3] >> 24,
      );
      break;
    case 5:
    case 6:
      c.push(part[2], part[2] >> 8, part[3], part[3] >> 8);
      break;
    case 3:
    case 4:
      d = part[2], z = 0;
      do c.push((e = s_u(d[z]).subarray(0, 255)).length, ...e); while (
        ++z < d.length
      );
      break;
    case 7:
      c.push(part[2], part[2] >> 8, part[3], part[3] >> 8), d = part[4], z = 0;
      do c.push((e = s_u(d[z]).subarray(0, 255)).length, ...e); while (
        ++z < d.length
      );
  }
  return new Uint8Array(c);
};
const OPTION = /^(?:[^\n\t,]|,(?! )){1,255}$/;
export const decode = (raw: U8): Part | Error => {
  let z = 1;
  const a = test<Key>(/^[A-Z]\w{0,254}$/i, u_s(raw.subarray(z, z += raw[0])));
  if (a instanceof Error) return a;
  let b = raw[z++], c, d, e, f, g;
  switch (b) {
    case 0:
    case 2:
      return [a, b];
    case 1:
      return [
        a,
        b,
        (raw[z++] | raw[z++] << 8 | raw[z++] << 16 | raw[z++] << 24) >>> 0,
        (raw[z++] | raw[z++] << 8 | raw[z++] << 16 | raw[z++] << 24) >>> 0,
      ];
    case 5:
    case 6:
      return [a, b, raw[z++] | raw[z++] << 8, raw[z++] | raw[z++] << 8];
    case 3:
    case 4:
      c = [];
      while (d = raw[z++]) {
        if (OPTION.test(e = u_s(raw.subarray(z, z += d)))) c.push(e);
      }
      return [a, b, c];
    case 7:
      f = raw[z++] | raw[z++] << 8, g = raw[z++] | raw[z++] << 8, c = [];
      while (d = raw[z++]) {
        if (OPTION.test(e = u_s(raw.subarray(z, z += d)))) c.push(e);
      }
      return [a, b, f, g, c];
  }
  return Error("Wanted type 0/1/2/3/4/5/6/7, got " + b);
};
const between = (min: number, max: number) => Math.random() * (max - min) + min;
export const random = (part: Part) => {
  let z, a, b, c;
  switch (part[1]) {
    case 0:
      return Math.random() > 0.5 ? "yes" : "no";
    case 1:
      return String(between(part[2], part[3]) >>> 0);
    case 2:
      return String(between(-0x100000000, 0x100000000));
    case 3:
      return part[2][Math.random() * part[2].length | 0];
    case 4:
      c = "", z = 0;
      for (z = 0, c = ""; z < part[2].length; ++z) {
        if (Math.random() > 0.5) c = `${part[2][z]}, ${c}`;
      }
      return c.slice(0, -2);
    case 5:
      a = between(part[2], part[3]) >>> 0;
      b = crypto.getRandomValues(new Uint8Array(a));
      for (z = 0, c = ""; z < a; ++z) {
        c += String.fromCharCode(b[z] % 26 + (b[z] > 127 ? 65 : 97));
      }
      return c;
    case 6:
      a = between(part[2], part[3]) >>> 0;
      b = crypto.getRandomValues(new Uint8Array(a));
      for (z = 0, c = ""; z < a; ++z) c += b[z] * Math.random() + ", ";
      return c.slice(0, -2);
    case 7:
      a = between(part[2], part[3]) >>> 0;
      b = crypto.getRandomValues(new Uint16Array(a));
      for (z = 0, c = ""; z < a; ++z) {
        c += part[4][b[z] % part[4].length] + ", ";
      }
      return c.slice(0, -2);
  }
};
export const s_d = (part: Part, string: string) => {
  let z, Z, a, b, c, d, e;
  switch (part[1]) {
    case 0:
      if (string === "yes") return 1;
      if (string === "no") return 0;
      return Error("Wanted yes/no, got " + string);
    case 1:
      if (!Number.isInteger(a = +string)) {
        return Error("Wanted integer, got " + string);
      }
      if (a < part[2]) return Error(`Wanted >= ${part[2]}, got ${a}`);
      if (a > part[3]) return Error(`Wanted <= ${part[3]}, got ${a}`);
      return a;
    case 2:
      return +string;
    case 3:
      if ((a = part[2].indexOf(string)) !== -1) return a;
      return Error(`Wanted ${part[2].join("/")}, got ${string}`);
    case 4:
      Z = (b = string.split(", ")).length, c = z = 0;
      do if ((d = part[2].indexOf(b[z])) !== -1) c |= 1 << d; while (++z < Z);
      return c;
    case 5:
      ENCODER.encodeInto(string, e = new Uint8Array(part[3]));
      return e;
    case 6:
      z = 0, Z = (b = string.split(", ")).length, e = new Float64Array(part[3]);
      do e[z] = +b[z]; while (++z < Z);
      do e[z] = Infinity; while (++z < e.length);
      return e;
    case 7:
      z = 0, Z = (b = string.split(", ")).length, e = new Uint16Array(part[3]);
      do e[z] = part[4].indexOf(b[z]) + 1; while (++z < Z);
      return e;
  }
};
export const d_s = (part: Part, data: ReturnType<typeof s_d>) => {
  let z, a, b;
  switch (part[1]) {
    case 0:
      return (<number> data) & 1 ? "yes" : "no";
    case 1:
    case 2:
      return String(data);
    case 3:
      return part[2][<number> data];
    case 4:
      a = "";
      while (data) {
        a += part[2][b = 31 - Math.clz32(<number> data)] + ", ";
        (<number> data) &= ~(1 << b);
      }
      return a.slice(0, -2);
    case 5:
      a = u_s(<U8> data).replaceAll("\0", "");
      return a;
    case 6:
      a = "", z = 0;
      while ((b = (<F64> data)[z++]) !== Infinity) a += b + ", ";
      return a.slice(0, -2);
    case 7:
      a = "", z = 0;
      while (b = (<U16> data)[z++]) a += part[4][b - 1] + ", ";
      return a.slice(0, -2);
  }
};

import.meta.vitest?.describe("parser", (t) => {
  const Z = 0x10, a = Array<Part>(Z);
  const b = crypto.getRandomValues(new Uint8Array(Z));
  const s = (A = 0x1f) => {
    let a = crypto.getRandomValues(new Uint8Array(A)), b = "";
    do b += String.fromCharCode(a[--A] % 26 + 65); while (A);
    return b;
  };
  let z = 0, y, c, d, e, f;
  do switch (c = `key_${z}` as const, d = b[z] & 7) {
    case 0:
    case 2:
      a[z] = [c, d];
      break;
    case 1:
      a[z] = [
        c,
        d,
        e = Math.random() * 0x100000000 >>> 0,
        Math.min(e + Math.random() * 0x100000000, 0xffffffff) >>> 0,
      ];
      break;
    case 3:
    case 4:
      for (y = 0, f = Array<string>(Z); y < Z; ++y) f[y] = s();
      a[z] = [c, d, f];
      break;
    case 5:
    case 6:
      a[z] = [
        c,
        d,
        e = Math.random() * 0x10 >>> 0,
        Math.min(e + Math.random() * 0x10, 0xffff) >>> 0,
      ];
      break;
    case 7:
      for (y = 0, f = Array<string>(Z); y < Z; ++y) f[y] = s();
      a[z] = [
        c,
        d,
        e = Math.random() * 0x100 >>> 0,
        Math.min(e + Math.random() * 0x100, 0xffff) >>> 0,
        f,
      ];
  } while (++z < Z);
  t("encode decode", ({ expect }) => {
    z = 0;
    do expect(decode(encode(a[z]))).toEqual(a[z]); while (++z < Z);
  });
  const g = Array<string[]>(Z), h = Array<ReturnType<typeof s_d>[]>(Z);
  z = 0;
  do g[z] = Array(Z), h[z] = Array(Z); while (++z < Z);
  t("random", ({ expect }) => {
    z = 0, y = 0;
    do do expect(h[z][y] = s_d(a[z], g[z][y] = random(a[z])))
      .not.toBeInstanceOf(Error); while (++y < Z); while (++z < Z);
  });
  t("s_d d_s", ({ expect }) => {
    z = 0, y = 0;
    do do expect(d_s(a[z], h[z][y]))
      .toBe(g[z][y]); while (++y < Z); while (++z < Z);
  });
});
