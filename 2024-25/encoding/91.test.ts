import {
  assertEquals,
  assertMatch,
  assertNotMatch,
} from "jsr:@std/assert@^1.0.0";
import { a_s91, base91, s91_a } from "../spec/91.ts";
import { read, rv } from "./test.ts";

Deno.test("base91", async () => {
  assertMatch("", base91, "empty ok");
  assertMatch("", base91, "source ok");
  assertMatch(
    (await read("Base91.hs")).match(
      /(?<=alphabet = \[[\n -~]+?')([ -~])(?='[\n -~]*?\]\n\n)/g,
    )!.join(""),
    base91,
    "source ok",
  );
  for (const a of "'-\\") assertNotMatch(a, base91, "exclude");
});
Deno.test(a_s91.name, () => {
  const a = new Uint8Array(256);
  for (let z = 0; z < a.length; ++z) {
    assertMatch(a_s91(rv(a.subarray(z))), base91, "regex");
  }
});
Deno.test(s91_a.name, () => {
  const a = new Uint8Array(256);
  for (let z = 0; z < a.length; ++z) {
    const b = rv(a.subarray(z));
    assertEquals(s91_a(a_s91(b)), b, "back to same bytes");
  }
  assertEquals(s91_a(a_s91(new Uint8Array([0]))), new Uint8Array([0]), "short");
  assertEquals(
    s91_a(a_s91(new Uint8Array(32))),
    new Uint8Array(32),
    "empty ok",
  );
  assertEquals(
    s91_a(a_s91(new Uint8Array(32).fill(-1))),
    new Uint8Array(32).fill(-1),
    "full ok",
  );
});
