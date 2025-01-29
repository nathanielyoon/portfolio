import { ENCODER, s_u, test, u_s } from "../base/text.ts";

type U = // deno-fmt-ignore
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
export type Key = `${U | Lowercase<U>}${string}`;
export type Data =
  & { [A in Key]: number }
  & { [A in `$${Key}`]: Uint8Array | Uint16Array | Uint32Array | Float64Array }
  & { __proto__: null; $$: Uint8Array; $: number };
export type Part = [
  Key,
  | [type: 0 | 2]
  | [type: 1 | 5 | 6, min: number, max: number]
  | [type: 3 | 4, options: string[]]
  | [type: 7, min: number, max: number, options: string[]],
];
/** Converts a part to a Uint8Array. */
export const encode = (part: Part) => {
  const a = s_u(part[0]).subarray(0, 255);
  const b = part[1][0], c = [a.length, ...a, b];
  let z, d, e;
  switch (b) {
    case 1:
      d = part[1][1], e = part[1][2];
      c.push(d, d >> 8, d >> 16, d >> 24, e, e >> 8, e >> 16, e >> 24);
      break;
    case 5:
    case 6:
      d = part[1][1], e = part[1][2], c.push(d, d >> 8, e, e >> 8);
      break;
    case 3:
    case 4:
      d = part[1][1], z = 0;
      do c.push((e = s_u(d[z]).subarray(0, 255)).length, ...e); while (
        ++z < d.length
      );
      break;
    case 7:
      d = part[1][1], e = part[1][2];
      c.push(d, d >> 8, e, e >> 8), d = part[1][3], z = 0;
      do c.push((e = s_u(d[z]).subarray(0, 255)).length, ...e); while (
        ++z < d.length
      );
  }
  return new Uint8Array(c);
};
const OPTION = /^(?:[^\n\t,]|,(?! )){1,255}$/;
/** Converts a Uint8Array to a part. */
export const decode = (raw: Uint8Array): Part | Error => {
  let z = 1;
  const a = test<Key>(/^[A-Z]\w{0,254}$/i, u_s(raw.subarray(z, z += raw[0])));
  if (a instanceof Error) return a;
  let b = raw[z++], c, d, e, f, g;
  switch (b) {
    case 0:
    case 2:
      return [a, [b]];
    case 1:
      return [a, [
        b,
        (raw[z++] | raw[z++] << 8 | raw[z++] << 16 | raw[z++] << 24) >>> 0,
        (raw[z++] | raw[z++] << 8 | raw[z++] << 16 | raw[z++] << 24) >>> 0,
      ]];
    case 5:
    case 6:
      return [a, [b, raw[z++] | raw[z++] << 8, raw[z++] | raw[z++] << 8]];
    case 3:
    case 4:
      c = [];
      while (d = raw[z++]) {
        if (OPTION.test(e = u_s(raw.subarray(z, z += d)))) c.push(e);
      }
      return [a, [b, c]];
    case 7:
      f = raw[z++] | raw[z++] << 8, g = raw[z++] | raw[z++] << 8, c = [];
      while (d = raw[z++]) {
        if (OPTION.test(e = u_s(raw.subarray(z, z += d)))) c.push(e);
      }
      return [a, [b, f, g, c]];
  }
  return Error("Wanted type 0/1/2/3/4/5/6/7, got " + b);
};
export function base(this: Data, part: Part) {
  switch (part[1][0]) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 4:
      this[part[0]] = 0;
      break;
    case 5:
      this[`$${part[this[part[0]] = 0]}`] = new Uint8Array(part[1][2]);
      break;
    case 6:
      this[`$${part[this[part[0]] = 0]}`] = new Float64Array(part[1][2]);
      break;
    case 7:
      this[`$${part[this[part[0]] = 0]}`] = new Uint16Array(part[1][2]);
  }
}
const between = (min: number, max: number) =>
  Math.random() * (max - min + 1) + min;
/** Generates a random-ish matching string. */
export const random = (part: Part) => {
  let a = part[1], b, c, d, z;
  switch (a[0]) {
    case 0:
      return Math.random() > 0.5 ? "yes" : "no";
    case 1:
      return String(between(a[1], a[2]) >>> 0);
    case 2:
      return String(between(-0x100000000, 0x100000000));
    case 3:
      return a[1][Math.random() * a[1].length | 0];
    case 4:
      c = crypto.getRandomValues(new Uint8Array(a[1].length)), d = "", z = 0;
      for (z = 0, d = ""; z < a[1].length; ++z) {
        if (c[z] & 1) d = `${a[1][z]}, ${d}`;
      }
      return d.slice(0, -2);
    case 5:
      b = a[1] < 16 && a[2] > 16 ? 16 : between(a[1], a[2]) >>> 0;
      c = crypto.getRandomValues(new Uint16Array(b));
      for (z = 0, d = ""; z < b; ++z) {
        switch (c[z] >> 14) {
          case 0:
            d += String.fromCharCode(c[z] % 10 + 48);
            break;
          case 1:
            d += String.fromCharCode(c[z] % 26 + 65);
            break;
          default:
            d += String.fromCharCode(c[z] % 26 + 97);
        }
      }
      return d;
    case 6:
      b = between(a[1], a[2]) >>> 0;
      c = crypto.getRandomValues(new Uint8Array(b));
      for (z = 0, d = ""; z < b; ++z) d += c[z] * Math.random() + ", ";
      return d.slice(0, -2);
    case 7:
      b = between(a[1], a[2]) >>> 0;
      c = crypto.getRandomValues(new Uint16Array(b));
      for (z = 0, d = ""; z < b; ++z) {
        d += a[3][c[z] % a[3].length] + ", ";
      }
      return d.slice(0, -2);
  }
};
/** Converts a string to a number or typed array. */
export function parse(this: Data, part: Part, value: string) {
  switch (part[1][0]) {
    case 0:
      if (value === "yes") this[part[0]] = 1;
      else if (value === "no") this[part[0]] = 0;
      else return Error("Wanted yes/no, got " + value);
      break;
    case 1: {
      const a = +value;
      if (!Number.isInteger(a)) return Error("Wanted integer, got " + a);
      if (a < part[1][1]) return Error(`Wanted >= ${part[1][1]}, got ${a}`);
      if (a > part[1][2]) return Error(`Wanted <= ${part[1][2]}, got ${a}`);
      this[part[0]] = a;
      break;
    }
    case 2:
      if (Number.isNaN(this[part[0]] = +value)) {
        return Error("Wanted number, got " + value);
      }
      break;
    case 3: {
      const a = part[1][1].indexOf(value);
      if (a === -1) {
        return Error(`Wanted ${part[1][1].join("/")}, got ${value}`);
      }
      this[part[0]] = a;
      break;
    }
    case 4: {
      let a = value.split(", "), b = part[1][1], c = 0, d, Z = a.length, z = 0;
      do if ((d = b.indexOf(a[z])) !== -1) c |= 1 << d; while (++z < Z);
      this[part[0]] = c;
      break;
    }
    case 5:
      this[part[0]] = ENCODER.encodeInto(
        value,
        this[`$${part[0]}`] = new Uint8Array(part[1][2]),
      ).written;
      break;
    case 6: {
      const a = value.split(", "), b = new Float64Array(part[1][2]);
      let c = 0, Z = a.length, z = 0;
      do if (a[z]) b[z] = +a[z], ++c; while (++z < Z);
      this[`$${part[0]}`] = b, this[part[0]] = c;
      break;
    }
    case 7: {
      const a = value.split(", "), b = part[1][3];
      let c = new Uint16Array(part[1][2]), d = 0, e, Z = a.length, z = 0;
      do if ((e = b.indexOf(a[z])) !== -1) c[z] = e, ++d; while (++z < Z);
      this[`$${part[0]}`] = c, this[part[0]] = d;
    }
  }
}
/** Converts a number or typed array to a string. */
export function stringify(this: Data, part: Part, value = "") {
  value &&= value + "\t";
  switch (part[1][0]) {
    case 0:
      return value + (this[part[0]] & 1 ? "yes" : "no");
    case 1:
    case 2:
      return value + this[part[0]];
    case 3:
      return value + part[1][1][this[part[0]]];
    case 4: {
      let a = this[part[0]], b = part[1][1], c = "", d;
      while (a) c += b[d = 31 - Math.clz32(a)] + ", ", a &= ~(1 << d);
      return value + c.slice(0, -2);
    }
    case 5:
      return value + u_s(this[`$${part[0]}`].subarray(0, this[part[0]]));
    case 6: {
      let a = this[`$${part[0]}`], b = this[part[0]], c = "";
      for (let z = 0; z < b; ++z) c += a[z] + ", ";
      return value + c.slice(0, -2);
    }
    case 7: {
      let a = this[`$${part[0]}`], b = this[part[0]], c = "";
      for (let z = 0, d = part[1][3]; z < b; ++z) c += d[a[z]] + ", ";
      return value + c.slice(0, -2);
    }
  }
}

import.meta.vitest?.describe("parser", (t) => {
  const Z = 0x20, a = Array<Part>(Z);
  const b = crypto.getRandomValues(new Uint8Array(Z));
  const s = (A = 32) => {
    let a = crypto.getRandomValues(new Uint8Array(A)), b = "";
    do b += String.fromCharCode(a[--A] % 26 + 65); while (A);
    return b;
  };
  let z = 0, y, c, d, e, f;
  do switch (c = `key_${z}` as const, d = b[z] & 7) {
    case 0:
    case 2:
      a[z] = [c, [d]];
      break;
    case 1:
      a[z] = [c, [
        d,
        e = Math.random() * 0x100000000 >>> 0,
        Math.min(e + Math.random() * 0x100000000, 0xffffffff) >>> 0,
      ]];
      break;
    case 3:
      for (y = 0, f = Array<string>(Z); y < Z; ++y) f[y] = s();
      a[z] = [c, [d, f]];
      break;
    case 4:
      for (y = 0, f = Array<string>(32); y < 32; ++y) f[y] = s();
      a[z] = [c, [d, f]];
      break;
    case 5:
    case 6:
      a[z] = [c, [
        d,
        e = Math.random() * 0x100 >>> 0,
        e + Math.random() * 0x100 >>> 0,
      ]];
      break;
    case 7:
      for (y = 0, f = Array<string>(Z); y < Z; ++y) f[y] = s();
      a[z] = [c, [
        d,
        e = Math.random() * 0x100 >>> 0,
        e + Math.random() * 0x100 >>> 0,
        f,
      ]];
  } while (++z < Z);
  a[Z - 1] = ["string", [5, 1, 32]];
  t("encode decode", ({ expect }) => {
    z = 0;
    do expect(decode(encode(a[z]))).toEqual(a[z]); while (++z < Z);
    expect(decode(new Uint8Array([1, 49, 7]))).toBeInstanceOf(Error);
    expect(decode(new Uint8Array([1, 97, 8]))).toBeInstanceOf(Error);
  });
  const g = Array<string[]>(Z), h = Array<Data>(Z);
  z = 0;
  do g[z] = Array(Z),
    h[z] = { __proto__: null, $$: new Uint8Array(), $: 0 }; while (++z < Z);
  t("base", ({ expect }) => {
    const i = { __proto__: null, $$: new Uint8Array(), $: 0 };
    z = 0;
    do base.call(i, a[z]); while (++z < Z);
    expect(String(Object.values(i))).toMatch(/^[0,]+$/);
  });
  t("random", ({ expect }) => {
    z = 0;
    do for (y = 0, c = h[z]; y < Z; ++y) {
      expect(parse.call(c, a[y], g[z][y] = random(a[y]))).toBeUndefined();
    } while (++z < Z);
  });
  t("parse stringify", ({ expect }) => {
    z = 0;
    do for (y = 0, c = h[z]; y < Z; ++y) {
      expect(stringify.call(c, a[y])).toBe(g[z][y]);
    } while (++z < Z);
    z = 0;
    do {
      for (y = 0, c = h[z], d = ""; y < Z; ++y) d = stringify.call(c, a[y], d);
      expect(d).toBe(g[z].join("\t"));
    } while (++z < Z);
  });
  t("bad strings", ({ expect }) => {
    const a = parse.bind({ __proto__: null, $$: new Uint8Array(), $: 0 });
    expect(a(["hi", [0]], "maybe")).toBeInstanceOf(Error);
    expect(a(["hi", [1, 0, 1]], "hi")).toBeInstanceOf(Error);
    expect(a(["hi", [2]], "hi")).toBeInstanceOf(Error);
    expect(a(["hi", [1, 1, 2]], "0")).toBeInstanceOf(Error);
    expect(a(["hi", [1, 1, 2]], "3")).toBeInstanceOf(Error);
    expect(a(["hi", [3, ["hello"]]], "hey")).toBeInstanceOf(Error);
  });
});
