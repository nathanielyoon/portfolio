import { B58_32, b58_u, u_b58 } from "../base/58.ts";
import { query } from "../base/mph.ts";
import { ENCODER, s_u, test, u_s } from "../base/text.ts";

export type Part = [
  Key,
  ...(
    | [type: 0 | 2]
    | [type: 3 | 4, options: string[]]
    | [type: 1 | 5 | 6, min: number, max: number]
    | [type: 7, min: number, max: number, options: string[]]
  ),
];
const a: Part[] = [
  ["round", 3, [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
  ]],
  ["gov", 2],
  ["opp", 2],
  ["chair", 2],
  ["panel", 6, 0, 8],
  ["room", 2],
];
export const encode = (part: Part) => {
  const a = s_u(part[0]).subarray(0, 255), b = part[1], c = [a.length, ...a, b];
  let z, d, e;
  switch (b) {
    case 1:
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
export const decode = (raw: U8): Part | Error => {
  let z = 1;
  const a = test<Key>(
    "part > key",
    /^[A-Z]\w{0,254}$/i,
    u_s(raw.subarray(z, z += raw[0])),
  );
  if (a instanceof Error) return a;
  let b = raw[z++], c, d, e, f;
  switch (b) {
    case 0:
    case 2:
      return [a, b];
    case 1:
    case 5:
    case 6:
      return [a, b, raw[z++] | raw[z++] << 8, raw[z++] | raw[z++] << 8];
    case 3:
    case 4:
      c = [];
      while (d = raw[z++]) c.push(u_s(raw.subarray(z, z += d)));
      return [a, b, c];
      break;
    case 7:
      e = raw[z++] | raw[z++] << 8, f = raw[z++] | raw[z++] << 8, c = [];
      while (d = raw[z++]) c.push(u_s(raw.subarray(z, z += d)));
      return [a, b, e, f, c];
  }
  return Error("Expected type > 0,1,2,3,4,5,6,7");
};
