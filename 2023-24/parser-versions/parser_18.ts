type Part<A extends string> = [
  A,
  | [type: 0 | 2]
  | [type: 1 | 5 | 6, min: number, max: number]
  | [type: 3, options: string[]]
  | [type: 4 | 7, min: number, max: number, options: string[]],
];
const ESCAPE = /[$(-+./?[-^{|}]/g;
export const compile = <A extends string>(parts: Part<A>[]) => {
  let a = "^(?<$>[1-9A-HJ-NP-Za-km-z]{45})";
  for (let z = 0, y, b, c; z < parts.length; a += ")", ++z) {
    switch ((a += `\\t(?<${parts[z][0]}>`, b = parts[z][1])[0]) {
      case 0:
        a += "yes|no";
        break;
      case 1:
        for (a += y = b[1]; y < b[2]; ++y) a += "|" + y;
        break;
      case 2:
        a += "-?\\d+(?:\\.\\d+)?";
        break;
      case 3:
        for (y = 0, c = ""; y < b[1].length; ++y) {
          c += "|" + b[1][y].replace(ESCAPE, "\\$&");
        }
        a += c.slice(1);
        break;
      case 4:
        for (y = 0, c = ""; y < b[3].length; ++y) {
          c += "|" + b[3][y].replaceAll("&&", "&").replace(ESCAPE, "\\$&");
        }
        a += `(?:(?:${c.slice(1)})(?:&&|(?=\\t|$))){${b[1]},${b[2]}}`;
        break;
      case 5:
        a += `[^\\n\\t\\0]{${b[1]},${b[2]}}`;
        break;
      case 6:
        a += `(?:(?:-?\\d+(?:\\.\\d+)?)(?:&&|(?=\\t|$))){${b[1]},${b[2]}}`;
        break;
      case 7:
        for (y = 0, c = ""; y < b[3].length; ++y) {
          c += "|" + b[3][y].replaceAll("&&", "&").replace(ESCAPE, "\\$&");
        }
        a += `(?:(?:${c.slice(1)})(?:&&|(?=\\t|$))){${b[1]},${b[2]}}`;
        break;
    }
  }
  return RegExp(a + "$");
};
type Value<A> = A extends Part<infer B>
  ? A[1][0] extends 0 ? { [C in B]: "yes" | "no" }
  : A[1][0] extends 1 | 2 ? { [C in B]: number }
  : A[1][0] extends 3 | 5 ? { [C in B]: string }
  : A[1][0] extends 4 ? { [C in B]: Set<string> }
  : A[1][0] extends 6 ? { [C in B]: number[] }
  : A[1][0] extends 7 ? { [C in B]: string[] }
  : never
  : never;
type Intersection<A> = (A extends any ? (A: A) => void : never) extends
  ((A: infer B) => void) ? B : never;

export const parse = <A extends string, B extends Part<A>>(
  parts: B[],
  regex: RegExp,
  string: string,
) => {
  const a = regex.exec(string);
  if (!a) return Error(`Wanted ${regex} (w.wiki/8968), got ${string}`);
  const b = a.groups!;
  for (let z = 0, y, Z, c, d, e, f, g; z < parts.length; ++z) {
    switch ((c = a[z + 2], d = parts[z][0], e = parts[z][1])[0]) {
      case 1:
      case 2: // @ts-expect-error
        b[d] = Number(c);
        break;
      case 4: // @ts-expect-error
        b[d] = new Set(c.split("&&"));
        break;
      case 6:
        f = c.split("&&"), g = Array<number>(Z = f.length);
        for (y = 0; y < Z; ++y) g[y] = Number(f[y]); // @ts-expect-error
        b[d] = g;
        break;
      case 7: // @ts-expect-error
        b[d] = c.split("&&");
    }
  }
  return b;
};
