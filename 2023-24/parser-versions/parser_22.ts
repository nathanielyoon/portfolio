import { s_u, u_s } from "../base/text.ts";

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
export const encode = ([A, B]: [string, Part]) => {
  const a = s_u(A).subarray(0, 31), b = [B[0] | a.length << 3, ...a];
  switch (B[0]) {
    case 1:
    case 5:
    case 6:
      b.push(B[1], B[1] >> 8, B[2], B[2] >> 8);
      break;
    case 3:
    case 4:
      for (let z = 0, c; z < B[1].length; ++z) {
        b.push((c = s_u(B[1][z]).subarray(0, 255)).length, ...c);
      }
      b.push(0);
      break;
    case 7:
      b.push(B[1], B[1] >> 8, B[2], B[2] >> 8);
      for (let z = 0, c; z < B[3].length; ++z) {
        b.push((c = s_u(B[3][z]).subarray(0, 255)).length, ...c);
      }
      b.push(0);
  }
  return new Uint8Array(b);
};
export const decode = (A: Uint8Array): [string, Part, RegExp] => {
  const a = A[0], b = <0 | 1 | 2 | 3 | 4 | 5 | 6 | 7> (a & 7);
  let z = 1, c = u_s(A.subarray(1, z += a >> 3));
  switch (b) {
    case 0:
      return [c, [0], /^(?:yes|no)$/];
    case 1: {
      let d = A[z++] | A[z++] << 8, e = A[z++] | A[z++] << 8, f = "";
      for (let z = d; z <= e; ++z) f += z + "|";
      return [c, [1, d, e], RegExp(`^(?:${f.slice(0, -1)})$`)];
    }
    case 2:
      return [c, [2], /^-?\d+(?:\.\d+)?$/];
    case 3: {
      let d = [], e = "", f, g;
      while (f = A[z++]) {
        d.push(g = u_s(A.subarray(z, z += f)));
        e += g.replace(ESCAPE, "\\$&") + "|";
      }
      return [c, [3, d], RegExp(`^(?:${e.slice(0, -1)})$`)];
    }
    case 4: {
      let d = [], e = "", f, g;
      while (f = A[z++]) {
        d.push(g = u_s(A.subarray(z, z += f)));
        e += g.replace(ESCAPE, "\\$&") + "|";
      }
      return [c, [3, d], RegExp(`^(?:(?:${e.slice(0, -1)})(?:&|$))*$`)];
    }
      // case 5:
      // case 6:
      //   return [c, [b, A[z++] | A[z++] << 8, A[z++] | A[z++] << 8]];
      // case 3:
      // case 4:
      //   d = [];
      //   while (e = A[z++]) d.push(u_s(A.subarray(z, z += e)));
      //   return [c, [b, d]];
      // case 7:
      //   d = [], f = A[z++] | A[z++] << 8, g = A[z++] | A[z++] << 8;
      //   while (e = A[z++]) d.push(u_s(A.subarray(z, z += e)));
      //   return [c, [b, f, g, d]];
  }
};
const ESCAPE = /[$(-+./?[-^{|}]/g;
const clamp = (value: number, min = 0) => Math.min(65535, Math.max(min, value));
export const pattern = (A: Part) => {
  switch (A[0]) {
    case 0:
      return /^(?:yes|no)$/;
    case 1: {
      let a = "", z = clamp(A[1]), Z = clamp(A[2], z);
      while (z <= Z) a += z++ + "|";
      return RegExp(`^(?:${a.slice(0, -1)})$`);
    }
    case 2:
      return /^-?\\d+(?:\\.\\d+)?$/;
    case 3: {
      let a = "", z = 0, Z = A[1].length;
      while (z < Z) a += A[1][z++].replace(ESCAPE, "\\$&") + "|";
      return a.slice(0, -1);
    }
    case 4: {
      let a = "", z = 0, Z = A[1].length;
      while (z < Z) {
        a += A[1][z++].replaceAll("&", "and").replace(ESCAPE, "\\$&") + "|";
      }
      return RegExp(`^(?:(?:${a.slice(0, -1)})(?:&|(?=\\t|$)))*$`);
    }
    case 5: {
      const a = clamp(A[1]);
      return RegExp(`^[^\\n\\t]{${a},${clamp(A[2], a)}}$`);
    }
    case 6: {
      const a = clamp(A[1]);
      return RegExp(
        `^(?:-?\\d+(?:\\.\\d+)?(?:&|(?=\\t|$))){${a},${clamp(A[2], a)}}$`,
      );
    }
    case 7: {
      let a = "", z = 0, Z = A[3].length, b = clamp(A[1]);
      while (z < Z) {
        a += A[3][z++].replaceAll("&", "and").replace(ESCAPE, "\\$&") + "|";
      }
      return RegExp(
        `^(?:(?:${a.slice(0, -1)})(?:&|(?=\\t|$))){${b},${clamp(A[2], b)}}$`,
      );
    }
  }
};

import.meta.vitest?.describe("regex", (t) => {
  const string = (A: number) => {
    let a = crypto.getRandomValues(new Uint8Array(A)), b, c = "";
    do switch ((b = a[--A]) >> 6) {
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
  const a: Parts = {}, Z = 0x10, b = crypto.getRandomValues(new Uint8Array(Z));
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
  const d = Object.entries(a);
  t("encode decode", ({ expect }) => {
    for (let z = 0; z < Z; ++z) expect(d[z]).toEqual(decode(encode(d[z])));
  });
});
