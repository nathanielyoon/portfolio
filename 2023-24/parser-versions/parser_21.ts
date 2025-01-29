export type Part =
  | [type: 0 | 2]
  | [type: 1 | 5 | 6, min: number, max: number]
  | [type: 3 | 4, options: string[]]
  | [type: 7, min: number, max: number, options: string[]];
export type Parts = Record<string, Part>;
type Type<A extends Part[0]> = A extends 0 ? boolean
  : A extends 1 | 2 | 3 ? number
  : A extends 4 ? Set<number>
  : A extends 5 ? string
  : number[];
export type Data<A extends Parts> = { [B in keyof A]: Type<A[B][0]> };
const ESCAPE = /[$(-+./?[-^{|}]/g;
export const compile = (parts: Record<string, Omit<Part, "regex">>) => {
  let a = Object.entries<Part>(parts), Z = a.length, b = Array(Z), c = "^";
  for (let z = 0, y, d, e; z < Z; c += e + ")\\t", ++z) {
    switch ((c += `(?<${a[z][0]}>`, d = a[z][1])[0]) {
      case 0:
        e = "yes|no";
        break;
      case 1:
        e = "\d+";
        break;
      case 2:
        e = "-?\\d+(?:\\.\\d+)?";
        break;
      case 3:
        for (y = 0, e = ""; y < d[1].length; ++y) {
          e += "|" + d[1][y].replace(ESCAPE, "\\$&");
        }
        e = e.slice(1);
        break;
      case 4:
        for (y = 0, e = ""; y < d[1].length; ++y) {
          e += "|" + d[1][y].replaceAll("&", "and").replace(ESCAPE, "\\$&");
        }
        e = `(?:(?:${e.slice(1)})(?:&|(?=\\t|$)))*`;
        break;
      case 5:
        e = `[^\\n\\t\\0]{${d[1]},${d[2]}}`;
        break;
      case 6:
        e = `(?:(?:-?\\d+(?:\\.\\d+)?)(?:&|(?=\\t|$))){${d[1]},${d[2]}}`;
        break;
      case 7:
        for (y = 0, e = ""; y < d[3].length; ++y) {
          e += "|" + d[3][y].replaceAll("&", "and").replace(ESCAPE, "\\$&");
        }
        e = `(?:(?:${e.slice(1)})(?:&|(?=\\t|$))){${d[1]},${d[2]}}`;
    }
  }
  return RegExp(c.slice(0, -2) + "$");
};
const string = (A: number) => {
  let a = crypto.getRandomValues(new Uint16Array(A)), b, c = "";
  do switch ((b = a[--A]) >> 14) {
    case 0:
      c += b % 10;
      break;
    case 1:
      c += String.fromCharCode(b % 26 + 65);
      break;
    default:
      c += String.fromCharCode(b % 26 + 97);
  } while (A);
  return c;
};
export const s_d = <A extends Parts>(parts: A, regex: RegExp, from: string) => {
  const a = regex.exec(from);
  if (!a) return Error(`Wanted ${regex}, got ${from}`);
  const b = a.groups as unknown as Data<Parts>;
  const c = <(string & keyof A)[]> Object.keys(parts);
  for (let z = 0, y, Z, d, e, f, g, h; z < c.length; ++z) {
    switch ((d = a[z + 1], f = parts[e = c[z]])[0]) {
      case 0:
        b[e] = d === "yes";
        break;
      case 1:
      case 2:
        b[e] = +d;
        break;
      case 3:
        b[e] = f[1].indexOf(d);
        break;
      case 4:
        Z = (g = d.split("&")).length, h = Array<number>(Z);
        for (y = 0; y < Z; ++y) if (g[y]) h[y] = f[1].indexOf(g[y]);
        b[e] = new Set(h);
        break;
      case 6:
        Z = (g = d.split("&")).length, h = Array<number>(Z);
        for (y = 0; y < Z; ++y) h[y] = +g[y];
        b[e] = h;
        break;
      case 7:
        Z = (g = d.split("&")).length, h = Array<number>(Z);
        for (y = 0; y < Z; ++y) if (g[y]) h[y] = f[3].indexOf(g[y]);
        b[e] = h;
    }
  }
  return <Data<A>> b;
};
export const d_s = <A extends Parts>(parts: A, from: Data<A>) => {
  let a = Object.keys(parts), b = "";
  for (let z = 0, y, Z, c, d, e, f, g; z < a.length; b += "\t", ++z) {
    switch ((d = parts[c = a[z]], e = from[c], d)[0]) {
      case 0:
        b += e ? "yes" : "no";
        break;
      case 1:
      case 2:
      case 5:
        b += e;
        break;
      case 3:
        b += d[1][<number> e];
        break;
      case 4:
        g = "";
        for (f of <Set<number>> e) g += d[1][f] + "&";
        b += g.slice(0, -1);
        break;
      case 6:
        for (y = 0, Z = (<number[]> e).length, g = ""; y < Z; ++y) {
          g += (<number[]> e)[y] + "&";
        }
        b += g.slice(0, -1);
        break;
      case 7:
        for (y = 0, Z = (<number[]> e).length, g = ""; y < Z; ++y) {
          g += d[3][(<number[]> e)[y]] + "&";
        }
        b += g.slice(0, -1);
    }
  }
  return b.slice(0, -1);
};

import.meta.vitest?.describe("regex", (t) => {
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
});
