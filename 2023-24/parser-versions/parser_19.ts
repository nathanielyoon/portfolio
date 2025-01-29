type Part = [
  string,
  | [type: 0 | 2]
  | [type: 1 | 5 | 6, min: number, max: number]
  | [type: 3, options: string[]]
  | [type: 4 | 7, min: number, max: number, options: string[]],
];
type Data = Record<string, string | number | Set<string> | string[] | number[]>;
const ESCAPE = /[$(-+./?[-^{|}]/g;
export const compile = (parts: Part[]) => {
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
export const parse = (parts: Part[], regex: RegExp, string: string) => {
  const a = regex.exec(string);
  if (!a) return Error(`Wanted ${regex} (w.wiki/8968), got ${string}`);
  const b = a.groups as unknown as Data;
  for (let z = 0, y, Z, c, d, e, f, g; z < parts.length; ++z) {
    switch ((c = a[z + 2], d = parts[z][0], e = parts[z][1])[0]) {
      case 1:
      case 2:
        b[d] = Number(c);
        break;
      case 4:
        b[d] = new Set(c.split("&&"));
        break;
      case 6:
        f = c.split("&&"), g = Array<number>(Z = f.length);
        for (y = 0; y < Z; ++y) g[y] = Number(f[y]);
        b[d] = g;
        break;
      case 7:
        b[d] = c.split("&&");
    }
  }
  return b;
};
export const stringify = () => {};
