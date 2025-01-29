import { assertEquals } from "@std/assert/equals";
import { b_s16, read, slice, test } from "./test.ts";
import { csv_json, json_csv } from "../spec/csv.ts";

test("rfc4180", async () => {
  const a = slice(await read("csv/rfc4180.txt"), {
    1: [2740, 40],
    2: [2888, 35],
    3: [3393, 85],
    4: [3983, 11],
    5: [4285, 41],
    6: [4465, 54],
    7: [4713, 19],
  });
  const b = {
    1: [["aaa", "bbb", "ccc"], ["zzz", "yyy", "xxx"]],
    2: [["aaa", "bbb", "ccc"], ["zzz", "yyy", "xxx"]],
    3: [
      ["field_name", "field_name", "field_name"],
      ["aaa", "bbb", "ccc"],
      ["zzz", "yyy", "xxx"],
    ],
    4: [["aaa", "bbb", "ccc"]],
    5: [["aaa", "bbb", "ccc"], ["zzz", "yyy", "xxx"]],
    6: [["aaa", "b\r\nbb", "ccc"], ["zzz", "yyy", "xxx"]],
    7: [["aaa", 'b"bb', "ccc"]],
  };
  for (const c of [1, 2, 3, 4, 5, 6, 7] as const) {
    const d = a[c].replaceAll("CRLF", "\r\n");
    const e = b[c];
    assertEquals(csv_json(json_csv(e)), e, "encode decode");
    assertEquals(
      csv_json(d.replaceAll("\r", "")),
      e.map((Y) => Y.map((X) => X.replaceAll("\r", ""))),
      "just LF",
    );
  }
});
test(`${csv_json.name}, ${json_csv.name}`, (rng) => {
  const a = new Uint8Array(2), b = Array<string[]>(4);
  let c = "", d, e, f, z = 0, y;
  do {
    d = b[z] = Array<string>(6), y = 0;
    do {
      e = a[y], f = b_s16(rng(a));
      if (e & 4) {
        d[y] = e & 8 ? f = f.replaceAll("0", '"') : f;
        c += `"${f.replaceAll('"', '""')}"`;
      } else c += d[y] = f;
    } while (c += ",", ++y < d.length);
  } while (c = `${c.slice(0, -1)}${z & 1 ? "" : "\r"}\n`, ++z < b.length);
  assertEquals(csv_json(c), b, "ok");
});
const dehead = (json: string[][]) => {
  const a = json[0], b = Array<{ [_: string]: string }>(json.length - 1);
  let c: { [_: string]: string }, g, z = 0, y;
  while (++z < json.length) {
    c = b[z - 1] = {}, g = json[z], y = 0;
    while (y < a.length) c[a[y]] = g[y++];
  }
  return b;
};
test("csv-spectrum", async () => {
  const a = [
    "comma_in_quotes",
    "empty_crlf",
    "empty",
    "escaped_quotes",
    "json",
    // "location_coordinates",
    "newlines_crlf",
    "newlines",
    "quotes_and_newlines",
    "simple_crlf",
    "simple",
    "utf8",
  ];
  for (let z = 0; z < a.length; ++z) {
    assertEquals(
      dehead(csv_json(await read(`csv/csv/${a[z]}.csv`))),
      JSON.parse(await read(`csv/json/${a[z]}.json`)),
      a[z],
    );
  }
});
