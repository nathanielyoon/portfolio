import { u_b91 } from "../base/91.ts";
import { hash } from "../base/hash.ts";
import { no, s_u, u_s } from "../base/text.ts";

type Part =
  | [key: string, type: 0] // boolean
  | [key: string, type: 1] // uint8
  | [key: string, type: 2] // uint32
  | [key: string, type: 3] // float64
  | [key: string, type: 4, options: string[]] // enum
  | [key: string, type: 5, options: string[]] // bitset
  | [key: string, type: 6, min: number, max: number] // string
  | [key: string, type: 7, min: number, max: number] // uint32array
  | [key: string, type: 8, min: number, max: number] // float64array
  | [key: string, type: 9, min: number, max: number, options: string[]]; // array
const numbers = (one: unknown, two: unknown) => {
  if (typeof one !== "number") return no("Number", one);
  if (typeof two !== "number") return no("Number", two);
  if (one > two) return no("Maximum > minimum", `${one},${two}`);
  return two;
};
export class Parser {
  static from_json(json: string) {
    const a = JSON.parse(json);
    if (!Array.isArray(a) || !a.length) return no("Array", a);
    let b, c, d, z = 0, y = 0, x, Z = a.length, Y;
    do {
      if (!Array.isArray(b = a[z]) || b.length < 2) return no("Array", b);
      if (typeof b[0] !== "string") return no("String", b[0]);
      switch (b[1]) {
        case 3:
          y += 4;
        case 2:
          y += 3;
        case 0:
        case 1:
          if (b.length > 2) return no("Two items", b);
          ++y;
          break;
        case 5:
          y += 2;
        case 4:
          if (!Array.isArray(c = b[2])) return no("Array", c);
          x = 0, Y = c.length, y += 2;
          do if (typeof c[x] !== "string") no("String", c[x]); while (++x < Y);
          break;
        case 6:
          y += numbers(b[2], b[3]);
          break;
        case 7:
          y += numbers(b[2], b[3]) << 2;
          break;
        case 8:
          y += numbers(b[2], b[3]) << 3;
          break;
        case 9:
          if (!Array.isArray(c = b[4])) return no("Array", c);
          x = 0, Y = c.length;
          do if (typeof c[x] !== "string") no("String", c[x]); while (++x < Y);
          y += numbers(b[2], b[3]) << 1;
          break;
        default:
          return no("Number 0-9", b[1]);
      }
    } while (++z < Z);
    return new Parser(<Part[]> a, y);
  }
  static from_binary(raw: U8) {
    let a: Part[] = [], b, c, d, e, f, g, z = 0, y = 0, Z = raw.length;
    do switch (b = raw[z++], c = u_s(raw.subarray(z, z += b)), d = raw[z++]) {
      case 3:
        y += 4;
      case 2:
        y += 3;
      case 0:
      case 1:
        a.push([c, d]), ++y;
        break;
      case 5:
        y += 2;
      case 4:
        e = <string[]> [];
        while (f = raw[z++]) e.push(u_s(raw.subarray(z, z += f)));
        a.push([c, d, e]), y += 2;
        break;
      case 6:
        f = raw[z++] | raw[z++] << 8, y += g = raw[z++] | raw[z++] << 8;
        a.push([c, d, f, g]);
        break;
      case 7:
        f = raw[z++] | raw[z++] << 8, y += (g = raw[z++] | raw[z++] << 8) << 2;
        a.push([c, d, f, g]);
        break;
      case 8:
        f = raw[z++] | raw[z++] << 8, y += (g = raw[z++] | raw[z++] << 8) << 3;
        a.push([c, d, f, g]);
        break;
      case 9:
        e = <string[]> [];
        while (f = raw[z++]) e.push(u_s(raw.subarray(z, z += f)));
        f = raw[z++] | raw[z++] << 8, y += (g = raw[z++] | raw[z++]) << 1;
        a.push([c, d, f, g, e]);
        break;
      default:
        no("Type byte", c);
    } while (z < Z);
    if (!a.length) no("1+ parts", a);
    return new Parser(a, y);
  }
  constructor(public parts: Part[], public size: number) {}
  toJSON() {
    return this.parts;
  }
  get bytes() {
    let a: number[] = [], b, c, d, e, f, z = 0, y, Z = this.parts.length;
    do {
      a.push((c = s_u((b = this.parts[z])[0])).length, ...c, b[1]);
      switch (b[1]) {
        case 4:
        case 5:
          e = b[2], y = 0;
          do a.push((c = s_u(e[y])).length, ...c); while (++y < e.length);
          a.push(0);
          break;
        case 9:
          e = b[4], y = 0;
          do a.push((c = s_u(e[y])).length, ...c); while (++y < e.length);
          a.push(0);
        case 6:
        case 7:
        case 8:
          a.push((f = b[2]) & 0xff, f >> 8, (f = b[3]) & 0xff, f >> 8);
      }
    } while (++z < Z);
    return new Uint8Array(a);
  }
  toString() {
    return u_b91(this.bytes);
  }
  get id() {
    const a = this.bytes, b = new Uint32Array(Math.ceil(a.length / 4));
    return new Uint8Array(b.buffer).set(a), hash(b);
  }
}

import.meta.vitest?.describe("parser", t => {
  const a = JSON.stringify([
    ["boolean", 0],
    ["uint8", 1],
    ["uint32", 2],
    ["float64", 3],
    ["enum", 4, ["zero", "one", "two", "three", "four", "five"]],
    ["bitset", 5, ["0", "1", "2", "3", "4", "5"]],
    ["string", 6, 1, 32],
    ["uint32array", 7, 1, 3],
    ["float64array", 8, 0, 5],
    ["array", 9, 0, 3, ["A", "B", "C", "D", "E"]],
  ]);
  const b = Parser.from_json(a);
  t("equal", ({ expect }) => {
    expect(Parser.from_binary(b.bytes).id).toBe(b.id);
    expect(Parser.from_json(JSON.stringify(b.toJSON())).id).toBe(b.id);
  });
});
