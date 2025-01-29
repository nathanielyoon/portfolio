import { assert, assertEquals, assertFalse } from "@std/assert";
import { n_s1627, s1627_n, words } from "../spec/words.ts";
import { read, test } from "./test.ts";

test(`${n_s1627.name} ${s1627_n.name}`, () => {
  const a = crypto.getRandomValues(new Uint32Array(256));
  for (let z = 0; z < a.length; ++z) {
    for (const b of [z, a[z], 0x100000000 - z - 1]) {
      const c = n_s1627(b), d = c.split("-");
      assertFalse(d[0] === d[1] || d[1] === d[2] || d[1] === d[2], "different");
      assertEquals(s1627_n(c), b, "same");
    }
  }
});
test("words", async () => {
  const a = new Set([
    ...(await read("words/bip39.txt")).split("\n"),
    ...(await read("words/eff_short_1.txt")).match(/[a-z-]+/g) ?? [],
  ]);
  const b = words.source.split("-")[0].slice(2, -1).split("|");
  for (let z = 0; z < b.length; ++z) {
    assert(a.has(b[z]) || a.has(b[z] + "s") || a.has(b[z] + "y"), b[z]);
  }
});
