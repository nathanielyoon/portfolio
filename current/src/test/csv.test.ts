import { assertEquals } from "@std/assert";
import { b_s16 } from "lib/16.ts";
import { csv_json, json_csv } from "lib/csv.ts";
import { read, slice, test } from "./test.ts";
import { url } from "./test.ts";

test("rfc4180", async () => {
  const rfc_csv = slice(await read("csv/rfc4180.txt"), {
    1: [2740, 40],
    2: [2888, 35],
    3: [3393, 85],
    4: [3983, 11],
    5: [4285, 41],
    6: [4465, 54],
    7: [4713, 19],
  });
  const rfc_json = {
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
  for (const z of [1, 2, 3, 4, 5, 6, 7] as const) {
    const csv = rfc_csv[z].replaceAll("CRLF", "\r\n");
    const json = rfc_json[z];
    assertEquals(csv_json(json_csv(json)), json, `${z}`);
    assertEquals(
      csv_json(csv.replaceAll("\r", "")),
      json.map((Y) => Y.map((X) => X.replaceAll("\r", ""))),
      "just LF",
    );
  }
});
test(`${csv_json.name}, ${json_csv.name}`, (rng) => {
  const buffer = new Uint8Array(2), json = Array<string[]>(4);
  let csv = "", record, at, value, z = 0, y;
  do {
    record = json[z] = Array<string>(6), y = 0;
    do {
      at = buffer[y], value = b_s16(rng(buffer));
      if (at & 4) {
        record[y] = at & 8 ? value = value.replaceAll("0", '"') : value;
        csv += `"${value.replaceAll('"', '""')}"`;
      } else csv += record[y] = value;
    } while (csv += ",", ++y < record.length);
    csv = `${csv.slice(0, -1)}${z & 1 ? "" : "\r"}\n`;
  } while (++z < json.length);
  assertEquals(csv_json(csv), json, "ok");
});
const head = (json: (string | null)[][]) => {
  const header = Array.from(json[0], (Z) => Z ?? "");
  const headed = Array<{ [_: string]: string | null }>(json.length - 1);
  let record: { [_: string]: string | null }, value, z = 0, y;
  while (++z < json.length) {
    record = headed[z - 1] = {}, value = json[z], y = 0;
    while (y < header.length) record[header[y]] = value[y++];
  }
  return headed;
};
test("csv-spectrum", async () => {
  const all_cases = await Array.fromAsync(
    Deno.readDir(url("public/static/csv/csv-spectrum")),
    (entry) => entry.name.replace(/\..+$/, ""),
  );
  const names = [...new Set(all_cases)];
  for (let z = 0; z < names.length; ++z) {
    const name = names[z];
    assertEquals(
      head(csv_json(await read(`csv/csv-spectrum/${name}.csv`))),
      JSON.parse(await read(`csv/csv-spectrum/${name}.json`)),
      name,
    );
  }
});
test("csv-test-data", async () => {
  const all_cases = await Array.fromAsync(
    Deno.readDir(url("public/static/csv/csv-test-data")),
    (entry) => entry.name.replace(/\..+$/, ""),
  );
  const names = [...new Set(all_cases)];
  for (let z = 0; z < names.length; ++z) {
    const name = names[z];
    const actual = csv_json(await read(`csv/csv-test-data/${name}.csv`));
    assertEquals(
      name.startsWith("header-") ? head(actual) : actual,
      JSON.parse(await read(`csv/csv-test-data/${name}.json`)),
      name,
    );
  }
});
