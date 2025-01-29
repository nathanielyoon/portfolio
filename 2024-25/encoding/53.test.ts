import { assertEquals, assertMatch } from "jsr:@std/assert@^1.0.0";
import { a_s53, base53, s53_a } from "../lib/53.ts";
import { rv } from "./test.ts";

Deno.test(a_s53.name, () => {
  const a = new Uint8Array(256);
  for (let z = 0; z < a.length; ++z) {
    assertMatch(a_s53(rv(a.subarray(z))), base53, "regex");
  }
});
Deno.test(s53_a.name, () => {
  const a = new Uint8Array(256);
  for (let z = 0; z < a.length; ++z) {
    const b = rv(a.subarray(0, z));
    assertEquals(s53_a(a_s53(b)), b, "back to same bytes");
  }
  assertEquals(s53_a(a_s53(new Uint8Array([0]))), new Uint8Array([0]), "short");
  assertEquals(
    s53_a(a_s53(new Uint8Array(32))),
    new Uint8Array(32),
    "empty ok",
  );
  assertEquals(
    s53_a(a_s53(new Uint8Array(32).fill(-1))),
    new Uint8Array(32).fill(-1),
    "full ok",
  );
});
