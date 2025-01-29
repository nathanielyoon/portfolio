type P =
  | [type: 0] // boolean
  | [type: 1, min: number, max: number] // integer
  | [type: 2] // float
  | [type: 3, options: string[]] // enum
  | [type: 4, options: string[]] // set
  | [type: 5, min: number, max: number, characters?: string] // string
  | [type: 6, min: number, max: number] // numbers
  | [type: 7, min: number, max: number, options: string[]]; // array
export type Parts = Record<string, P>;
type T<A extends P[0]> = A extends 0 ? boolean
  : A extends 1 | 2 | 3 ? number
  : A extends 4 ? Set<number>
  : A extends 5 ? string
  : number[];
export type Data<A extends Parts> =
  & { __proto__: null; $: number }
  & { [B in keyof A]: T<A[B][0]> };
const ESCAPE = /[$(-+.?[-^{|}]/g;
const NON_ASCII = /[^ -~]/g;
const NON_KEY = /\W|^[^A-Z]/gi;
/** Clamps a number to within a range. */
const clamp = (value: number, min = 0) => Math.min(65535, Math.max(min, value));
/**
 * Generates a union of numbers from a range.
 *
 * @param min Minimum.
 * @param max Maximum.
 * @returns String pattern for use in regular expression character classes.
 */
export const join = (min: number, max: number) => {
  let a = "";
  while (min <= max) a += "|" + min++;
  return a.slice(1);
};
/**
 * Converts a set of parts to a regular expression.
 *
 * @param parts Parts to convert.
 * @returns Regular expression with "global" and "multiline" flags set.
 */
export const encode = (parts: Parts) => {
  let a = Object.keys(parts), b = "^";
  for (let z = 0, y, Z, c, d, e; z < a.length; b += ")\\t", ++z) {
    b += `(?<${(c = a[z]).replace(NON_KEY, "").slice(0, 255)}>`;
    switch ((d = parts[c])[0]) {
      case 0:
        b += "yes|no";
        break;
      case 1:
        b += join(y = clamp(d[1]), clamp(d[2], y));
        break;
      case 2:
        b += "-?\\d+(?:\\.\\d+)?";
        break;
      case 3:
        y = 0, Z = d[1].length, e = "";
        while (y < Z) {
          e += "|" + d[1][y++].replace(NON_ASCII, "")
            .slice(0, 255).replaceAll("(", "[").replaceAll(")", "]")
            .replace(ESCAPE, "\\$&");
        }
        b += `(?:${e.slice(1)}){1}`;
        break;
      case 4:
        y = 0, Z = d[1].length, e = "";
        while (y < Z) {
          e += "|" + d[1][y++].replace(NON_ASCII, "").replaceAll("&", "and")
            .slice(0, 255).replaceAll("(", "[").replaceAll(")", "]")
            .replace(ESCAPE, "\\$&");
        }
        b += `(?:(?:${e.slice(1)})(?:&|(?=\\t|$)))*`;
        break;
      case 5:
        b += `[${
          d[3]?.replace(NON_ASCII, "").slice(0, 95).replace(ESCAPE, "\\$&") ||
          "^\\n\\t"
        }]{${y = clamp(d[1])},${clamp(d[2], y)}}`;
        break;
      case 6:
        b += `(?:-?\\d+(?:\\.\\d+)?(?:&|(?=\\t|$))){${y = clamp(d[1])},${
          clamp(d[2], y)
        }}`;
        break;
      case 7:
        y = 0, Z = d[3].length, e = "";
        while (y < Z) {
          e += "|" + d[3][y++].replace(NON_ASCII, "").replaceAll("&", "and")
            .slice(0, 255).replaceAll("(", "[").replaceAll(")", "]")
            .replace(ESCAPE, "\\$&");
        }
        b += `(?:(?:${e.slice(1)})(?:&|(?=\\t|$))){${y = clamp(d[1])},${
          clamp(d[2], y)
        }}`;
    }
  }
  return RegExp(b.slice(0, -2) + "$", "gm");
};
/** Un-escapes a list. */
const split = (A: string) => {
  const a = A.split(/(?<=[^\\](?:\\\\)*)\|/);
  for (let z = 0; z < a.length; ++z) a[z] = a[z].replace(/\\(.)/g, "$1");
  return a;
};
export const PART =
  /(?<=^\^|\\t)\(\?<([A-Z]\w{0,254})>(?:(yes\|no)|(\d{1,5}(?:\|\d{1,5}){0,65534})|(-\?\\d\+\(\?:\\\.\\d\+\)\?)|\(\?:([ -'*-~]{1,16776959}?)\)\{1\}|\(\?:\(\?:([ -'*-~]{1,16776959}?)\)\(\?:&\|\(\?=\\t\|\$\)\)\)\*|\[(\^\\n\\t|[ -~]{1,95})\]\{(\d{1,5}),(\d{1,5})\}|\(\?:-\?\\d\+\(\?:\\\.\\d\+\)\?\(\?:&\|\(\?=\\t\|\$\)\)\)\{(\d{1,5}),(\d{1,5})\}|\(\?:\(\?:([ -'*-~]{1,16776959}?)\)\(\?:&\|\(\?=\\t\|\$\)\)\)\{(\d{1,5}),(\d{1,5})\})\)(?=\\t|\$$)/gi;
/**
 * Converts a regular expression to a set of parts.
 *
 * @param pattern Pattern to convert.
 * @returns Key-value map of parts.
 */
export const decode = <A extends Parts>(pattern: string) => {
  let a: Parts = {}, b, c;
  while (b = PART.exec(pattern)) {
    if (b[2]) a[b[1]] = [0];
    else if (c = b[3]) a[b[1]] = [1, +/^\d+/.exec(c)![0], +/\d+$/.exec(c)![0]];
    else if (b[4]) a[b[1]] = [2];
    else if (c = b[5]) a[b[1]] = [3, split(c)];
    else if (c = b[6]) a[b[1]] = [4, split(c)];
    else if (c = b[7]) {
      a[b[1]] = c[0] === "^"
        ? [5, +b[8], +b[9]]
        : [5, +b[8], +b[9], split(c)[0]];
    } else if (c = b[10]) a[b[1]] = [6, +c, +b[11]];
    else if (c = b[12]) a[b[1]] = [7, +b[13], +b[14], split(c)];
  }
  return PART.lastIndex = 0, <A> a;
};
/**
 * Generates a base data object.
 *
 * @param parts Parts to generate.
 * @param id ID of object.
 * @returns Object with values set to default.
 */
export const base = <A extends Parts>(parts: A, id = 0) => {
  const a = <(string & keyof A)[]> Object.keys(parts);
  const b = <Data<Parts>> { __proto__: null, $: id };
  for (let z = 0, c, d; z < a.length; ++z) {
    switch ((d = parts[c = a[z]])[0]) {
      case 0:
        b[c] = false;
        break;
      case 1:
        b[c] = d[1];
        break;
      case 2:
      case 3:
        b[c] = 0;
        break;
      case 4:
        b[c] = new Set();
        break;
      case 5:
        b[c] = (d[3]?.[0] || "0").repeat(d[1]);
      case 6:
      case 7:
        b[c] = Array<number>(d[1]).fill(0);
    }
  }
  return <Data<A>> b;
};
/** Selects a random-ish number within a range. */
const between = (min: number, max: number) =>
  Math.random() * (max - min + 1) + min;
/**
 * Generates a random-ish data object.
 *
 * @param parts Parts to generate.
 * @param id ID of object.
 * @returns Object with (non-cryptographically-)random values.
 */
export const random = <A extends Parts>(parts: A, id = 0) => {
  const a = <(string & keyof A)[]> Object.keys(parts);
  const b = <Data<Parts>> { __proto__: null, $: id };
  for (let z = 0, y, Z, Y, c, d, e, f, g; z < a.length; ++z) {
    switch ((d = parts[c = a[z]])[0]) {
      case 0:
        b[c] = Math.random() > 0.5;
        break;
      case 1:
        b[c] = ~~between(d[1], d[2]);
        break;
      case 2:
        b[c] = Math.fround(between(-0x10000, 0x10000));
        break;
      case 3:
        b[c] = Math.random() * d[1].length | 0;
        break;
      case 4:
        e = crypto.getRandomValues(new Uint8Array(Z = d[1].length));
        for (y = 0, f = new Set<number>(); y < Z; ++y) e[y] & 1 && f.add(y);
        b[c] = f;
        break;
      case 5:
        e = crypto.getRandomValues(new Uint16Array(Z = ~~between(d[1], d[2])));
        if (g = d[3]) for (y = 0, f = ""; y < Z; ++y) f += g[e[y] % g.length];
        else {
          for (y = 0, f = ""; y < Z; ++y) {
            switch ((g = e[y]) >> 6) {
              case 0:
                f += g % 10;
                break;
              case 1:
                f += String.fromCharCode(g % 26 + 65);
                break;
              default:
                f += String.fromCharCode(g % 26 + 97);
            }
          }
        }
        b[c] = f;
        break;
      case 6:
        f = Array<number>(Z = ~~between(d[1], d[2]));
        for (y = 0; y < Z; ++y) f[y] = Math.fround(between(-0x10000, 0x10000));
        b[c] = f;
        break;
      case 7:
        f = Array<number>(Z = ~~between(d[1], d[2])), Y = d[3].length - 1;
        for (y = 0; y < Z; ++y) f[y] = between(0, Y) | 0;
        b[c] = f;
    }
  }
  return <Data<A>> b;
};
/**
 * Converts a string to data objects.
 *
 * @param parts Parts to convert with.
 * @param regex Regular expression (from {@link encode}).
 * @param raw String to convert.
 * @returns Array of data objects and array of input strings for each object.
 */
export const s_d = <A extends Parts>(parts: A, regex: RegExp, raw: string) => {
  const a = Object.keys(parts), b = [], c = new Set<string>(), d = [];
  let e, f, g, h, i, j, k, z, y, Z = a.length, Y;
  while (e = regex.exec(raw)) {
    if (c.size !== c.add(f = e[0]).size) {
      for (z = 0, (g = e.groups as unknown as Data<Parts>).$ = 0; z < Z; ++z) {
        switch ((i = parts[h = a[z]])[0]) {
          case 0:
            g[h] = g[h] !== "no";
            break;
          case 1:
          case 2:
            g[h] = +g[h];
            break;
          case 3:
            g[h] = i[1].indexOf(<string> g[h]);
            break;
          case 4:
            Y = (j = (<string> g[h]).split("&")).length, k = [];
            for (y = 0; y < Y; ++y) if (j[y]) k.push(i[1].indexOf(j[y]));
            g[h] = new Set(k);
            break;
          case 6:
            Y = (j = (<string> g[h]).split("&")).length, k = [];
            for (y = 0; y < Y; ++y) if (j[y]) k[y] = +j[y];
            g[h] = k;
            break;
          case 7:
            Y = (j = (<string> g[h]).split("&")).length, k = [];
            for (y = 0; y < Y; ++y) if (j[y]) k.push(i[3].indexOf(j[y]));
            g[h] = k;
            break;
        }
      }
      b.push(<Data<A>> g), d.push(f);
    }
  }
  return regex.lastIndex = 0, { data: b, raw: d };
};
/**
 * Converts data objects to strings.
 *
 * @param parts Parts to convert with.
 * @param data Array of data objects.
 * @returns Array of strings.
 */
export const d_s = <A extends Parts>(parts: A, data: Data<A>[]) => {
  const Z = data.length, a = Array<string>(Z), b = Object.keys(parts);
  for (let z = 0, Y = b.length, y, x, X, c, d, e, f, g, h; z < Z; ++z) {
    for (y = 0, c = data[z], d = ""; y < Y; ++y) {
      switch ((d += "\t", f = parts[e = b[y]])[0]) {
        case 0:
          d += c[e] ? "yes" : "no";
          break;
        case 1:
        case 2:
        case 5:
          d += c[e];
          break;
        case 3:
          d += f[1][<number> c[e]];
          break;
        case 4:
          x = 0, X = (g = [...<Set<number>> c[e]]).length, h = "";
          while (x < X) h += "&" + f[1][g[x++]];
          d += h.slice(1);
          break;
        case 6:
          x = 0, X = (g = <number[]> c[e]).length, h = "";
          while (x < X) h += "&" + g[x++];
          d += h.slice(1);
          break;
        case 7:
          x = 0, X = (g = <number[]> c[e]).length, h = "";
          while (x < X) h += "&" + f[3][g[x++]];
          d += h.slice(1);
      }
    }
    a[z] = d.slice(1);
  }
  return a;
};

/* v8 ignore next */
import.meta.vitest?.describe("regex", (t) => {
  const string = (A: number) => {
    let a = "";
    do a += String.fromCharCode(Math.random() * 95 + 32); while (--A);
    return a.replaceAll("&", "and").replaceAll("(", "[").replaceAll(")", "]");
  };
  const a: Parts = {}, Z = 0x80, b = crypto.getRandomValues(new Uint8Array(Z));
  for (let z = 0, y, c, d, e, f; z < Z; ++z) {
    switch (c = `part${z}`, d = b[z] & 7) {
      case 0:
      case 2:
        a[c] = [d];
        break;
      case 1:
      case 5:
      case 6:
        a[c] = [d, e = Math.random() * 16 | 0, e + Math.random() * 16 | 0];
        break;
      case 3:
      case 4:
        f = Array<string>(Math.random() * 0x80 + 1 | 0);
        for (y = 0; y < f.length; ++y) f[y] = string(32);
        a[c] = [d, f];
        break;
      case 7:
        f = Array<string>(Math.random() * 0x80 + 1 | 0);
        for (y = 0; y < f.length; ++y) f[y] = string(32);
        a[c] = [d, e = Math.random() * 16 | 0, e + Math.random() * 16 | 0, f];
    }
  }
  const c = encode(a);
  t("encode decode into same parts", ({ expect }) => {
    expect(decode(c.source)).toEqual(a);
  });
  t("base is same each time", ({ expect }) => {
    const d = base(a);
    expect(`${Object.values(d)}`).toMatch(/^(?:[\d,]|\[object Set\]|false)+$/);
    expect(base(a)).toEqual(d);
  });
  const d = Array<Data<typeof a>>(Z);
  for (let z = 0; z < Z; ++z) d[z] = random(a);
  const g = d_s(a, d);
  const { data } = s_d(a, c, g.join("\n"));
  t("random matches regex", ({ expect }) => {
    for (let z = 0; z < Z; ++z) c.lastIndex = 0, expect(g[z]).toMatch(c);
  });
  t("d_s s_d to same data", ({ expect }) => {
    for (let z = 0; z < Z; ++z) {
      expect(data[z]).toEqual(d[z]);
    }
  });
});
