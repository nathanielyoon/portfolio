import { assertEquals, assertMatch } from "@std/assert";
import { b_s64_0, b_s64_1, s64_b_0, s64_b_1, s_b } from "../spec/encoding.ts";
import { read, test } from "./test.ts";

const a = await read("encoding/rfc4648.txt");
test("rfc 4648", () => {
  const b = [...a.matchAll(/BASE64\("(\w+)"\) = "(\w+)=*"/g)];
  for (let z = 0; z < b.length; ++z) {
    const c = s_b(b[z][1]), d = b[z][2];
    assertEquals(b_s64_0(c), d, "encodes short");
    assertEquals(s64_b_0(d), c, "decodes short");
    assertEquals(b_s64_1(c), d, "encodes long");
    assertEquals(s64_b_1(d), c, "decodes long");
  }
});
test("b_s64", (rng) => {
  for (let z = 0, a = new Uint8Array(0x100); z < a.length; ++z) {
    const b = rng(a.subarray(0, z));
    assertMatch(b_s64_0(b), /^[-\w]*$/, "regex short");
    assertMatch(b_s64_1(b), /^[-\w]*$/, "regex long");
  }
});
test("s64_b", (rng) => {
  for (let z = 0, a = new Uint8Array(0x100); z < a.length; ++z) {
    const b = rng(a.subarray(0, z));
    assertEquals(s64_b_0(b_s64_0(b)), b, "encode decode short");
    assertEquals(s64_b_1(b_s64_1(b)), b, "encode decode long");
  }
});
